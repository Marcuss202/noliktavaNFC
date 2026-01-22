from django.urls import path
from . import views

urlpatterns = [
    path('', views.store_page, name='store_page'),
    path('register', views.register_page, name='register_page'),
    path('login', views.login_page, name='login_page'),
    path('dashboard', views.admin_dashboard, name='admin_dashboard'),
]