import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    """Crea el superusuario de DJANGO_SUPERUSER_USERNAME o, si ya existe, le pone la
    contraseña de DJANGO_SUPERUSER_PASSWORD. Pensado para el build de Render (sin Shell)."""
    help = "Crea o actualiza el superusuario desde variables de entorno"

    def handle(self, *args, **options):
        usuario = os.getenv('DJANGO_SUPERUSER_USERNAME')
        clave = os.getenv('DJANGO_SUPERUSER_PASSWORD')
        if not usuario or not clave:
            self.stdout.write("DJANGO_SUPERUSER_USERNAME/PASSWORD no definidas: no se toca ningún usuario.")
            return

        User = get_user_model()
        user, creado = User.objects.get_or_create(
            username=usuario, defaults={'email': os.getenv('DJANGO_SUPERUSER_EMAIL', '')})
        user.set_password(clave)
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.save()
        self.stdout.write(self.style.SUCCESS(f"Superusuario '{usuario}' {'creado' if creado else 'actualizado'}."))
