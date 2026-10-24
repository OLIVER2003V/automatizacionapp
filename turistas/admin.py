from django.contrib import admin
from .models import Tarifa, Viaje, Grupo, Turista

# Precios vigentes: una sola fila, se edita pero no se borra ni se duplica
@admin.register(Tarifa)
class TarifaAdmin(admin.ModelAdmin):
    list_display = ('precio_paquete', 'precio_rappel', 'precio_tirolesa', 'descuento_grupo', 'minimo_grupo', 'actualizado_en')

    def has_add_permission(self, request):
        return not Tarifa.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False

# Registramos la nueva tabla de Viajes
@admin.register(Viaje)
class ViajeAdmin(admin.ModelAdmin):
    list_display = ('fecha_salida', 'destino', 'estado_activo', 'precio_paquete', 'precio_rappel', 'precio_tirolesa', 'descuento_grupo')
    list_filter = ('estado_activo', 'fecha_salida')
    actions = ['recalcular_saldos']

    @admin.action(description="Recalcular saldos con los precios del viaje")
    def recalcular_saldos(self, request, queryset):
        for viaje in queryset:
            viaje.recalcular_saldos()
        self.message_user(request, f"Saldos recalculados en {queryset.count()} viaje(s).")

class TuristaEnGrupoInline(admin.TabularInline):
    model = Turista
    fields = ('nombre_completo', 'hace_rappel', 'hace_tirolesa', 'reserva', 'descuento', 'saldo')
    readonly_fields = ('descuento', 'saldo')
    extra = 0

@admin.register(Grupo)
class GrupoAdmin(admin.ModelAdmin):
    list_display = ('id', 'viaje', 'creado_en')
    list_filter = ('viaje',)
    inlines = [TuristaEnGrupoInline]

# Actualizamos la tabla de Turistas
@admin.register(Turista)
class TuristaAdmin(admin.ModelAdmin):
    # Cambiamos 'fecha_viaje' por 'viaje'
    list_display = ('nombre_completo', 'ci', 'reserva', 'descuento', 'saldo', 'hace_rappel', 'hace_tirolesa', 'viaje', 'grupo')
    readonly_fields = ('descuento', 'saldo')

    # Cambiamos 'fecha_viaje' por 'viaje'
    list_filter = ('viaje', 'hace_rappel', 'hace_tirolesa')

    search_fields = ('nombre_completo', 'ci')
