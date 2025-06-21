from django.shortcuts import render
from django.views.generic import View


# Create your views here.
class HomePageView(View):
    template_name = "chats/home.html"

    def get(self, request, *args, **kwargs):
        return render(request, self.template_name)
