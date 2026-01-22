from django.shortcuts import render

def register_page(request):
    return render(request, "register.html")


def login_page(request):
    return render(request, "login.html")


def store_page(request):
    return render(request, "store.html")


def admin_dashboard(request):
    return render(request, "admin_dashboard.html")