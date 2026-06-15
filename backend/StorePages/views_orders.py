from django.contrib.auth import get_user_model
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Order
from .serializers import OrderSerializer
User = get_user_model()
ORDER_SORT_FIELDS = {
    'created_at': ['created_at'],
    'status': ['status'],
    'email': ['email'],
    'full_name': ['full_name'],
    'city': ['city'],
    'address': ['street', 'house_number', 'city'],
}


class StaffOnlyMixin(APIView):
    permission_classes = [IsAuthenticated]

    def _ensure_staff(self, request):
        if not request.user.is_staff:
            return Response({'detail': 'Only admin users can access orders'}, status=403)
        return None


class OrderListView(StaffOnlyMixin):
    def get(self, request):
        denied = self._ensure_staff(request)
        if denied:
            return denied
        sort = (request.query_params.get('sort') or '-created_at').strip()
        descending = sort.startswith('-')
        key = sort[1:] if descending else sort
        fields = ORDER_SORT_FIELDS.get(key, ORDER_SORT_FIELDS['created_at'])
        if descending:
            fields = [f'-{field}' for field in fields]
        orders = (
            Order.objects
            .prefetch_related('items', 'items__product')
            .order_by(*fields, '-created_at')
        )

        return Response(OrderSerializer(orders, many=True).data)


class OrderDetailView(StaffOnlyMixin):
    def patch(self, request, pk):
        denied = self._ensure_staff(request)
        if denied:
            return denied
        try:
            order = Order.objects.prefetch_related('items', 'items__product').get(pk=pk)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found'}, status=404)
        new_status = (request.data.get('status') or '').strip()
        valid_statuses = {choice[0] for choice in Order.STATUS_CHOICES}
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Invalid status. Allowed: {sorted(valid_statuses)}'},
                status=400,
            )
        order.status = new_status
        order.save(update_fields=['status', 'updated_at'])
        return Response(OrderSerializer(order).data)


class AccountEmailsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        emails = list(
            User.objects.filter(is_active=True)
            .order_by('email')
            .values_list('email', flat=True)
        )

        return Response({'emails': emails})
