from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ViajeViewSet, TuristaViewSet, GrupoViewSet, TarifaView, ProcesarMensajeIAView, exportar_excel

router = DefaultRouter()
router.register(r'viajes', ViajeViewSet)
router.register(r'turistas', TuristaViewSet)
router.register(r'grupos', GrupoViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('tarifa/', TarifaView.as_view(), name='tarifa'),
    path('procesar-mensaje/', ProcesarMensajeIAView.as_view(), name='procesar_mensaje'),

    # Agregamos esta línea para las descargas de Excel
    path('exportar-excel/<int:viaje_id>/<str:tipo>/', exportar_excel, name='exportar_excel'),
]
