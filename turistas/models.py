from django.db import models
from django.db.models.signals import post_delete
from django.dispatch import receiver
from decimal import Decimal


class Tarifa(models.Model):
    """Precios vigentes. Hay una sola fila (pk=1) y se edita desde el admin.
    Cada viaje nuevo copia estos precios al crearse."""
    precio_paquete = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('270.00'))
    precio_rappel = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('120.00'))
    precio_tirolesa = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('120.00'))
    descuento_grupo = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('20.00'),
                                          help_text="Descuento por persona sobre el paquete")
    minimo_grupo = models.PositiveIntegerField(default=3, help_text="Personas mínimas para el descuento")
    reserva_sugerida = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('50.00'))
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Tarifa"
        verbose_name_plural = "Tarifa"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def actual(cls):
        tarifa, _ = cls.objects.get_or_create(pk=1)
        return tarifa

    def __str__(self):
        return f"Paquete {self.precio_paquete} / Rappel {self.precio_rappel} / Tirolesa {self.precio_tirolesa}"


CAMPOS_PRECIO = ['precio_paquete', 'precio_rappel', 'precio_tirolesa', 'descuento_grupo', 'minimo_grupo']


class Viaje(models.Model):
    fecha_salida = models.DateField(unique=True)
    destino = models.CharField(max_length=150, default="Jardín de las Delicias")
    estado_activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    # Copia de la tarifa al momento de crear el viaje (si se deja vacío se toma la tarifa vigente).
    # Así, cambiar la tarifa no altera los saldos de viajes ya registrados.
    precio_paquete = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    precio_rappel = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    precio_tirolesa = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    descuento_grupo = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    minimo_grupo = models.PositiveIntegerField(null=True, blank=True)

    def save(self, *args, **kwargs):
        es_nuevo = self.pk is None
        tarifa = Tarifa.actual()
        for campo in CAMPOS_PRECIO:
            if getattr(self, campo) is None:
                setattr(self, campo, getattr(tarifa, campo))
        super().save(*args, **kwargs)
        if not es_nuevo:
            self.recalcular_saldos()

    def recalcular_saldos(self):
        for grupo in self.grupos.all():
            grupo.recalcular_saldos()
        for turista in self.turistas.filter(grupo__isnull=True):
            turista.save()

    def __str__(self):
        return f"Salida: {self.fecha_salida} - {self.destino}"


class Grupo(models.Model):
    """Personas que llegaron juntas en un mismo chat/mensaje."""
    viaje = models.ForeignKey(Viaje, on_delete=models.CASCADE, related_name='grupos')
    creado_en = models.DateTimeField(auto_now_add=True)

    def recalcular_saldos(self):
        for turista in self.turistas.all():
            descuento, saldo = turista.calcular_montos()
            Turista.objects.filter(pk=turista.pk).update(descuento=descuento, saldo=saldo)

    def __str__(self):
        return f"Grupo {self.pk} ({self.viaje.fecha_salida})"


class Turista(models.Model):
    viaje = models.ForeignKey(Viaje, on_delete=models.CASCADE, related_name='turistas', null=True, blank=True)
    grupo = models.ForeignKey(Grupo, on_delete=models.SET_NULL, related_name='turistas', null=True, blank=True)
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
    descuento = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    saldo = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    def calcular_montos(self):
        """Devuelve (descuento, saldo) con los precios del viaje.
        saldo = paquete - descuento + rappel + tirolesa - reserva"""
        precios = self.viaje if self.viaje_id else Tarifa.actual()

        descuento = Decimal('0.00')
        if self.grupo_id:
            tamano = self.grupo.turistas.exclude(pk=self.pk).count() + 1
            if tamano >= precios.minimo_grupo:
                descuento = precios.descuento_grupo

        saldo = precios.precio_paquete - descuento - Decimal(str(self.reserva))
        if self.hace_rappel:
            saldo += precios.precio_rappel
        if self.hace_tirolesa:
            saldo += precios.precio_tirolesa
        return descuento, saldo

    def save(self, *args, **kwargs):
        # 1. Nombres limpios (Ej: yesica quelali -> Yesica Quelali)
        if self.nombre_completo:
            self.nombre_completo = self.nombre_completo.title()

        # 2. Un grupo no puede quedar en otro viaje
        if self.grupo_id and not self.viaje_id:
            self.viaje_id = self.grupo.viaje_id
        if self.grupo_id and self.grupo.viaje_id != self.viaje_id:
            self.grupo = None

        grupo_anterior = None
        if self.pk:
            grupo_anterior = Turista.objects.filter(pk=self.pk).values_list('grupo_id', flat=True).first()

        # 3. Matemáticas automáticas del saldo
        self.descuento, self.saldo = self.calcular_montos()
        super().save(*args, **kwargs)

        # 4. El tamaño del grupo cambió: recalcular a los compañeros
        for grupo_id in {grupo_anterior, self.grupo_id} - {None}:
            Grupo.objects.get(pk=grupo_id).recalcular_saldos()

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


@receiver(post_delete, sender=Turista)
def recalcular_grupo_al_eliminar(sender, instance, **kwargs):
    # Si el grupo baja de 3 personas, los que quedan pierden el descuento
    grupo = Grupo.objects.filter(pk=instance.grupo_id).first()
    if grupo:
        grupo.recalcular_saldos()
