from django.urls import path, include, re_path
from django.conf import settings
from django.views.static import serve
from rest_framework.routers import DefaultRouter
from StorePages.views_auth import RegisterView, MeView, LoginView, LogoutView
from StorePages.views_products import ProductViewSet, CheckoutSaleView
from StorePages.views_reports import DashboardReportView, SalesReportView, OrdersReportView
from StorePages.views_orders import OrderListView, OrderDetailView, AccountEmailsView
router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
urlpatterns = [
    path('api/auth/register', RegisterView.as_view(), name='register'),
    path('api/auth/login', LoginView.as_view(), name='login'),
    path('api/auth/logout', LogoutView.as_view(), name='logout'),
    path('api/auth/me', MeView.as_view(), name='me'),
    path('api/checkout', CheckoutSaleView.as_view(), name='checkout'),
    path('api/accounts/emails', AccountEmailsView.as_view(), name='account_emails'),
    path('api/orders', OrderListView.as_view(), name='order_list'),
    path('api/orders/<int:pk>', OrderDetailView.as_view(), name='order_detail'),
    path('api/reports/dashboard', DashboardReportView.as_view(), name='report_dashboard'),
    path('api/reports/sales', SalesReportView.as_view(), name='report_sales'),
    path('api/reports/orders', OrdersReportView.as_view(), name='report_orders'),
    path('api/', include(router.urls)),
]

urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]
