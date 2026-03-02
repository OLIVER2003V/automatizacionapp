from django.contrib import admin
from .models import Turista, Viaje

# Registramos la nueva tabla de Viajes
@admin.register(Viaje)
class ViajeAdmin(admin.ModelAdmin):
    list_display = ('fecha_salida', 'destino', 'estado_activo')
    list_filter = ('estado_activo', 'fecha_salida')

# Actualizamos la tabla de Turistas
@admin.register(Turista)
class TuristaAdmin(admin.ModelAdmin):
    # Cambiamos 'fecha_viaje' por 'viaje'
    list_display = ('nombre_completo', 'ci', 'reserva', 'saldo', 'hace_rappel', 'hace_tirolesa', 'viaje')
    
    # Cambiamos 'fecha_viaje' por 'viaje'
    list_filter = ('viaje', 'hace_rappel', 'hace_tirolesa')
    
    search_fields = ('nombre_completo', 'ci')