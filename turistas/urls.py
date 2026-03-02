from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ViajeViewSet, TuristaViewSet, ProcesarMensajeIAView, exportar_excel # <-- Importa la función aquí

router = DefaultRouter()
router.register(r'viajes', ViajeViewSet)
router.register(r'turistas', TuristaViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('procesar-mensaje/', ProcesarMensajeIAView.as_view(), name='procesar_mensaje'),
    
    # Agregamos esta línea para las descargas de Excel
    path('exportar-excel/<int:viaje_id>/<str:tipo>/', exportar_excel, name='exportar_excel'),
]