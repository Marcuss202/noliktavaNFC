from django.http import HttpResponse

# StorePages views
def index(request):
    return HttpResponse("Connected to Database")