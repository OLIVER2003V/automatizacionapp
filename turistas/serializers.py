from rest_framework import serializers
from .models import Viaje, Turista

class TuristaSerializer(serializers.ModelSerializer):
    # Incluimos la propiedad dinámica que armamos antes
    observaciones = serializers.ReadOnlyField()

    class Meta:
        model = Turista
        fields = '__all__'

class ViajeSerializer(serializers.ModelSerializer):
    # Esto nos permite ver los turistas anidados dentro de cada viaje
    turistas = TuristaSerializer(many=True, read_only=True)

    class Meta:
        model = Viaje
        fields = '__all__'