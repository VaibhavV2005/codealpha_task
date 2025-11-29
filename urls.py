from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from api.views import ProductViewSet, OrderViewSet, Register, Login

router = routers.DefaultRouter()
router.register(r'products', ProductViewSet, basename='products')
router.register(r'orders', OrderViewSet, basename='orders')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/auth/register', Register.as_view()),
    path('api/auth/login', Login.as_view()),
]