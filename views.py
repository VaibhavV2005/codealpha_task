from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import Product, Order, OrderItem
from .serializers import ProductSerializer, OrderSerializer

class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)

    def create(self, request):
        items = request.data.get('items', [])
        address = request.data.get('address', '')
        total = 0
        order = Order.objects.create(user=request.user, total=0, status='PENDING')
        for it in items:
            p = Product.objects.get(pk=it['productId'])
            q = int(it['quantity'])
            if p.stock < q: return Response({'error': 'Insufficient stock'}, status=400)
            total += float(p.price) * q
            OrderItem.objects.create(order=order, product=p, quantity=q, price=p.price)
            p.stock -= q; p.save()
        order.total = total; order.save()
        return Response(OrderSerializer(order).data, status=201)

from rest_framework.views import APIView
class Register(APIView):
    def post(self, request):
        username = request.data.get('username'); email = request.data.get('email'); password = request.data.get('password')
        if not all([username, email, password]): return Response({'error': 'Missing fields'}, status=400)
        if User.objects.filter(email=email).exists(): return Response({'error': 'Email exists'}, status=409)
        user = User.objects.create_user(username=username, email=email, password=password)
        return Response({'ok': True})

class Login(APIView):
    def post(self, request):
        email = request.data.get('email'); password = request.data.get('password')
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Invalid credentials'}, status=401)
        user = authenticate(username=user.username, password=password)
        if not user: return Response({'error': 'Invalid credentials'}, status=401)
        return Response({'ok': True})