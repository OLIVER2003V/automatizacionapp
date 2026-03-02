from django.db import models
from decimal import Decimal

class Viaje(models.Model):
    fecha_salida = models.DateField(unique=True)
    destino = models.CharField(max_length=150, default="Jardín de las Delicias")
    estado_activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Salida: {self.fecha_salida} - {self.destino}"

class Turista(models.Model):
    viaje = models.ForeignKey(Viaje, on_delete=models.CASCADE, related_name='turistas', null=True, blank=True)
    nombre_completo = models.CharField(max_length=200)
    ci = models.CharField(max_length=30, blank=True, null=True) 
    edad = models.IntegerField(blank=True, null=True)
    celular = models.CharField(max_length=20, blank=True, null=True)
    contacto_referencia = models.CharField(max_length=20, blank=True, null=True)
    es_vegetariano = models.BooleanField(default=False)
    condicion_medica = models.TextField(blank=True, null=True)
    hace_rappel = models.BooleanField(default=False)
    hace_tirolesa = models.BooleanField(default=False)
    reserva = models.DecimalField(max_digits=8, decimal_places=2, default=50.00)
    saldo = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # 1. Nombres limpios (Ej: yesica quelali -> Yesica Quelali)
        if self.nombre_completo:
            self.nombre_completo = self.nombre_completo.title()

        # 2. Matemáticas automáticas del saldo
        costo_paquete = Decimal('250.00')
        saldo_base = costo_paquete - Decimal(str(self.reserva))
        costo_extra = Decimal('0.00')
        if self.hace_rappel:
            costo_extra += Decimal('100.00')
        if self.hace_tirolesa:
            costo_extra += Decimal('100.00')
        self.saldo = saldo_base + costo_extra
        
        super().save(*args, **kwargs)

    def __str__(self):
        return self.nombre_completo

    @property
    def observaciones(self):
        obs = []
        if self.es_vegetariano:
            obs.append("VEG")
        
        if self.condicion_medica:
            texto_limpio = self.condicion_medica.strip().lower()
            # Si empieza con "no " o es igual a alguna de estas palabras, lo ignoramos por completo
            palabras_vacias = ['no', 'ninguna', 'ninguno', 'null', 'ningúna']
            
            if not texto_limpio.startswith('no ') and texto_limpio not in palabras_vacias:
                obs.append(self.condicion_medica)
                
        return " / ".join(obs) if obs else ""