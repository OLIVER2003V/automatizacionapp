import os
import json
from google import genai

from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response

from django.http import HttpResponse
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, Border, Side

from .models import Viaje, Turista
from .serializers import ViajeSerializer, TuristaSerializer

class ViajeViewSet(viewsets.ModelViewSet):
    queryset = Viaje.objects.all().order_by('-fecha_salida')
    serializer_class = ViajeSerializer

class TuristaViewSet(viewsets.ModelViewSet):
    queryset = Turista.objects.all().order_by('-fecha_registro')
    serializer_class = TuristaSerializer


# Ahora la API Key está oculta y segura
client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))

class ProcesarMensajeIAView(APIView):
    def post(self, request):
        mensaje = request.data.get('mensaje', '')
        
        if not mensaje:
            return Response({"error": "No se envió ningún mensaje"}, status=status.HTTP_400_BAD_REQUEST)

        prompt = f"""
        Eres un analista de datos experto trabajando para una agencia de turismo en Bolivia. 
        Tu única tarea es extraer la información de los turistas de mensajes de WhatsApp desordenados con precisión absoluta.
        
        REGLAS LÓGICAS DE EXTRACCIÓN:
        1. CI (Cédula de Identidad): En Bolivia es un número de 6 a 8 dígitos. Suele estar cerca del nombre. Búscalo exhaustivamente.
        2. Celulares: Los celulares en Bolivia tienen EXACTAMENTE 8 dígitos y empiezan con 6 o 7. 
        3. Actividades: Si el turista dice "depende" para rappel o tirolesa, pon el valor en TRUE obligatoriamente.
        4. Observaciones Médicas: Si la persona NO TIENE alergias, NO TIENE fracturas o dice "ninguna", pon EXACTAMENTE null. ESTÁ PROHIBIDO escribir "No alergias", "Ninguna", o "No fracturas". Solo pon null. Si la actividad "depende", anota "Depende clima".

        REGLAS DE FORMATO ESTRICTAS:
        - Devuelve ÚNICAMENTE un arreglo (array) de objetos JSON.
        - NO incluyas etiquetas de markdown como ```json.

        ESTRUCTURA JSON REQUERIDA:
        [
            {{
                "nombre_completo": "Nombre",
                "ci": "Número o null",
                "edad": número o null,
                "celular": "Número o null",
                "contacto_referencia": "Número o null",
                "es_vegetariano": true/false,
                "condicion_medica": "Texto o null",
                "hace_rappel": true/false,
                "hace_tirolesa": true/false
            }}
        ]

        MENSAJE A PROCESAR:
        "{mensaje}"
        """

        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
            )
            
            texto_limpio = response.text.replace('```json', '').replace('```', '').strip()
            datos_turistas = json.loads(texto_limpio)
            
            return Response(datos_turistas, status=status.HTTP_200_OK)

        except json.JSONDecodeError:
            return Response({"error": "La IA no devolvió un JSON válido.", "raw_response": response.text}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def exportar_excel(request, viaje_id, tipo):
    try:
        viaje = Viaje.objects.get(id=viaje_id)
        turistas = Turista.objects.filter(viaje=viaje).order_by('id')
    except Viaje.DoesNotExist:
        return HttpResponse("Viaje no encontrado", status=404)

    wb = Workbook()
    ws = wb.active
    ws.title = f"Lista_{tipo.capitalize()}"

    fuente_fecha = Font(size=36, bold=True, color="4F81BD", name="Calibri") 
    fuente_jardin = Font(size=40, bold=True, color="00B050", name="Impact")  
    
    fuente_cabecera = Font(bold=True, size=12, color="000000") 
    fuente_normal = Font(size=11, color="000000")
    
    alineacion_centro = Alignment(horizontal='center', vertical='center')
    alineacion_izquierda = Alignment(horizontal='left', vertical='center')
    borde_delgado = Border(left=Side(style='thin'), right=Side(style='thin'), top=Side(style='thin'), bottom=Side(style='thin'))

    ultima_columna = 'D' if tipo == 'cobro' else 'G'

    meses = {1: 'ENERO', 2: 'FEBRERO', 3: 'MARZO', 4: 'ABRIL', 5: 'MAYO', 6: 'JUNIO', 
             7: 'JULIO', 8: 'AGOSTO', 9: 'SEPTIEMBRE', 10: 'OCTUBRE', 11: 'NOVIEMBRE', 12: 'DICIEMBRE'}
    
    ws.merge_cells(f'A1:{ultima_columna}1')
    celda_fecha = ws['A1']
    celda_fecha.value = f"{viaje.fecha_salida.day} DE {meses[viaje.fecha_salida.month]}"
    celda_fecha.font = fuente_fecha
    celda_fecha.alignment = alineacion_centro
    ws.row_dimensions[1].height = 45

    ws.merge_cells(f'A2:{ultima_columna}2')
    celda_jardin = ws['A2']
    celda_jardin.value = "JARDÍN DE LAS DELICIAS"
    celda_jardin.font = fuente_jardin
    celda_jardin.alignment = alineacion_centro
    ws.row_dimensions[2].height = 50

    ws.append([]) 

    if tipo == 'cobro':
        cabeceras = ['N', 'NOMBRES', 'EDAD', 'C.I.']
        ws.append(cabeceras)
        for i, t in enumerate(turistas, start=1):
            ws.append([i, t.nombre_completo, t.edad if t.edad else '', t.ci if t.ci else ''])
            
    elif tipo == 'logistica':
        cabeceras = ['N', 'NOMBRES', 'RESERVAS', 'SALDO', 'RAPPEL', 'TIROLESA', 'OBS']
        ws.append(cabeceras)
        for i, t in enumerate(turistas, start=1):
            rappel = 'SI' if t.hace_rappel else 'NO'
            tirolesa = 'SI' if t.hace_tirolesa else 'NO'
            ws.append([i, t.nombre_completo, t.reserva, t.saldo, rappel, tirolesa, t.observaciones])

    for fila in ws.iter_rows(min_row=4, max_row=ws.max_row, min_col=1, max_col=len(cabeceras)):
        for celda in fila:
            celda.border = borde_delgado
            if celda.row == 4: 
                celda.font = fuente_cabecera
                celda.alignment = alineacion_centro
            else: 
                celda.font = fuente_normal
                if celda.column != 2: 
                    celda.alignment = alineacion_centro
                else:
                    celda.alignment = alineacion_izquierda

    ws.column_dimensions['A'].width = 5   
    ws.column_dimensions['B'].width = 35  
    if tipo == 'cobro':
        ws.column_dimensions['C'].width = 10
        ws.column_dimensions['D'].width = 20
    else:
        for col in ['C', 'D', 'E', 'F']:
            ws.column_dimensions[col].width = 15
        ws.column_dimensions['G'].width = 20

    response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response['Content-Disposition'] = f'attachment; filename="Lista_{tipo}_{viaje.fecha_salida}.xlsx"'
    wb.save(response)
    
    return response