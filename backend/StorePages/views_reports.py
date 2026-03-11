from datetime import timedelta
from decimal import Decimal

from django.db.models import DecimalField, ExpressionWrapper, F, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Product, Purchase, PurchaseItem, Sale, SaleItem
from .serializers import PurchaseSerializer, SaleSerializer


def _parse_range_days(range_value: str) -> int:
    if range_value == '7d':
        return 7
    if range_value == '90d':
        return 90
    return 30


def _as_float(value) -> float:
    if value is None:
        return 0.0
    if isinstance(value, Decimal):
        return float(value)
    return float(value)


def _money_expression(unit_field: str):
    return ExpressionWrapper(
        F('quantity') * F(unit_field),
        output_field=DecimalField(max_digits=14, decimal_places=2),
    )


class AdminStaffOnlyMixin(APIView):
    permission_classes = [IsAuthenticated]

    def _ensure_staff(self, request):
        if not request.user.is_staff:
            return Response({'detail': 'Only admin users can access reports'}, status=403)
        return None


class DashboardReportView(AdminStaffOnlyMixin):
    def get(self, request):
        denied = self._ensure_staff(request)
        if denied:
            return denied

        range_value = request.query_params.get('range', '30d')
        days = _parse_range_days(range_value)
        since = timezone.now() - timedelta(days=days)

        sales_items = SaleItem.objects.filter(sale__created_at__gte=since)
        purchases_items = PurchaseItem.objects.filter(purchase__created_at__gte=since)

        sales_total = sales_items.aggregate(total=Sum(_money_expression('unit_price')))['total']
        purchases_total = purchases_items.aggregate(total=Sum(_money_expression('unit_cost')))['total']
        sales_count = sales_items.values('sale_id').distinct().count()
        purchases_count = purchases_items.values('purchase_id').distinct().count()
        low_stock_qs = Product.objects.filter(stock_quantity__lte=10).order_by('stock_quantity', 'name')

        sales_series = (
            sales_items
            .annotate(day=TruncDate('sale__created_at'))
            .values('day')
            .annotate(total=Sum(_money_expression('unit_price')))
            .order_by('day')
        )
        purchases_series = (
            purchases_items
            .annotate(day=TruncDate('purchase__created_at'))
            .values('day')
            .annotate(total=Sum(_money_expression('unit_cost')))
            .order_by('day')
        )

        inventory_health = {
            'critical': Product.objects.filter(stock_quantity__lte=5).count(),
            'warning': Product.objects.filter(stock_quantity__gt=5, stock_quantity__lte=15).count(),
            'healthy': Product.objects.filter(stock_quantity__gt=15).count(),
        }

        payload = {
            'range': range_value,
            'kpis': {
                'sales_total': _as_float(sales_total),
                'purchases_total': _as_float(purchases_total),
                'sales_count': sales_count,
                'purchases_count': purchases_count,
                'low_stock_count': low_stock_qs.count(),
                'net_activity': _as_float(sales_total) - _as_float(purchases_total),
            },
            'sales_trend': [
                {'date': row['day'].isoformat(), 'amount': _as_float(row['total'])}
                for row in sales_series
            ],
            'purchases_trend': [
                {'date': row['day'].isoformat(), 'amount': _as_float(row['total'])}
                for row in purchases_series
            ],
            'inventory_health': inventory_health,
            'low_stock_products': [
                {
                    'id': product.id,
                    'name': product.name,
                    'stock_quantity': product.stock_quantity,
                    'nfc_tag_id': product.nfc_tag_id,
                }
                for product in low_stock_qs[:8]
            ],
        }
        return Response(payload)


class SalesReportView(AdminStaffOnlyMixin):
    def get(self, request):
        denied = self._ensure_staff(request)
        if denied:
            return denied

        range_value = request.query_params.get('range', '30d')
        days = _parse_range_days(range_value)
        since = timezone.now() - timedelta(days=days)

        sales_qs = (
            SaleItem.objects
            .filter(sale__created_at__gte=since)
            .select_related('sale', 'product')
            .order_by('-sale__created_at')
        )

        sales_total = sales_qs.aggregate(total=Sum(_money_expression('unit_price')))['total']
        trend = (
            sales_qs
            .annotate(day=TruncDate('sale__created_at'))
            .values('day')
            .annotate(total=Sum(_money_expression('unit_price')))
            .order_by('day')
        )

        top_products = (
            sales_qs
            .values('product__name')
            .annotate(total_quantity=Sum('quantity'))
            .order_by('-total_quantity')[:5]
        )

        sales_ids = sales_qs.values_list('sale_id', flat=True).distinct()

        payload = {
            'range': range_value,
            'summary': {
                'total_sales_amount': _as_float(sales_total),
                'sales_count': sales_ids.count(),
                'items_sold': sales_qs.aggregate(total_qty=Sum('quantity'))['total_qty'] or 0,
            },
            'trend': [
                {'date': row['day'].isoformat(), 'amount': _as_float(row['total'])}
                for row in trend
            ],
            'top_products': [
                {'name': row['product__name'], 'quantity': row['total_quantity']}
                for row in top_products
            ],
            'recent_sales': SaleSerializer(
                Sale.objects.filter(id__in=sales_ids).order_by('-created_at')[:10],
                many=True,
            ).data,
        }
        return Response(payload)


class PurchasesReportView(AdminStaffOnlyMixin):
    def get(self, request):
        denied = self._ensure_staff(request)
        if denied:
            return denied

        range_value = request.query_params.get('range', '30d')
        days = _parse_range_days(range_value)
        since = timezone.now() - timedelta(days=days)

        purchases_qs = (
            PurchaseItem.objects
            .filter(purchase__created_at__gte=since)
            .select_related('purchase', 'product')
            .order_by('-purchase__created_at')
        )

        purchases_total = purchases_qs.aggregate(total=Sum(_money_expression('unit_cost')))['total']
        trend = (
            purchases_qs
            .annotate(day=TruncDate('purchase__created_at'))
            .values('day')
            .annotate(total=Sum(_money_expression('unit_cost')))
            .order_by('day')
        )

        top_restocked = (
            purchases_qs
            .values('product__name')
            .annotate(total_quantity=Sum('quantity'))
            .order_by('-total_quantity')[:5]
        )

        purchase_ids = purchases_qs.values_list('purchase_id', flat=True).distinct()

        payload = {
            'range': range_value,
            'summary': {
                'total_purchases_amount': _as_float(purchases_total),
                'purchase_count': purchase_ids.count(),
                'items_received': purchases_qs.aggregate(total_qty=Sum('quantity'))['total_qty'] or 0,
            },
            'trend': [
                {'date': row['day'].isoformat(), 'amount': _as_float(row['total'])}
                for row in trend
            ],
            'top_restocked_products': [
                {'name': row['product__name'], 'quantity': row['total_quantity']}
                for row in top_restocked
            ],
            'recent_purchases': PurchaseSerializer(
                Purchase.objects.filter(id__in=purchase_ids).order_by('-created_at')[:10],
                many=True,
            ).data,
        }
        return Response(payload)
