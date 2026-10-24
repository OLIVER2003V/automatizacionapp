from django.db import transaction
from rest_framework import serializers
from .models import Tarifa, Viaje, Grupo, Turista

class TuristaSerializer(serializers.ModelSerializer):
    # Incluimos la propiedad dinámica que armamos antes
    observaciones = serializers.ReadOnlyField()

    class Meta:
        model = Turista
        fields = '__all__'
        # El saldo y el descuento siempre los calcula el servidor con los precios del viaje
        read_only_fields = ['descuento', 'saldo']

class ViajeSerializer(serializers.ModelSerializer):
    # Esto nos permite ver los turistas anidados dentro de cada viaje
    turistas = TuristaSerializer(many=True, read_only=True)

    class Meta:
        model = Viaje
        fields = '__all__'

class TarifaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tarifa
        exclude = ['id']

class TuristaEnGrupoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Turista
        exclude = ['viaje', 'grupo', 'descuento', 'saldo']

class GrupoSerializer(serializers.ModelSerializer):
    """Crea de una vez a todas las personas de un mismo chat como un grupo."""
    turistas = TuristaEnGrupoSerializer(many=True)

    class Meta:
        model = Grupo
        fields = ['id', 'viaje', 'creado_en', 'turistas']

    def validate_turistas(self, turistas):
        if not turistas:
            raise serializers.ValidationError("El grupo necesita al menos una persona.")
        return turistas

    @transaction.atomic
    def create(self, validated_data):
        turistas = validated_data.pop('turistas')
        grupo = Grupo.objects.create(**validated_data)
        for datos in turistas:
            Turista.objects.create(viaje=grupo.viaje, grupo=grupo, **datos)
        return grupo

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['turistas'] = TuristaSerializer(instance.turistas.all(), many=True).data
        return data
