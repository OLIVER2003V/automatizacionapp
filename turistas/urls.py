from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (LoginView, LogoutView, ViajeViewSet, TuristaViewSet, GrupoViewSet, TarifaView,
                    ProcesarMensajeIAView, exportar_excel)

router = DefaultRouter()
router.register(r'viajes', ViajeViewSet)
router.register(r'turistas', TuristaViewSet)
router.register(r'grupos', GrupoViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('tarifa/', TarifaView.as_view(), name='tarifa'),
    path('procesar-mensaje/', ProcesarMensajeIAView.as_view(), name='procesar_mensaje'),

    # Agregamos esta línea para las descargas de Excel
    path('exportar-excel/<int:viaje_id>/<str:tipo>/', exportar_excel, name='exportar_excel'),
]
