"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, RotateCcw, Edit2, Layers } from "lucide-react";
import { toast } from "sonner";

const containerStyle = {
  width: "100%",
  height: "500px",
};

const defaultCenter = {
  lat: 4.6097, // Bogotá
  lng: -74.0817,
};

const libraries: ("drawing" | "geometry")[] = ["drawing", "geometry"];

export interface PotreroGeometry {
  lat: number;
  lng: number;
}

export interface PotreroMapEditorProps {
  initialGeometry?: PotreroGeometry[];
  onPolygonComplete: (geometry: PotreroGeometry[], areaM2: number, areaHa: number) => void;
  onClose: () => void;
  apiKey: string;

  existingPolygons?: Array<{
    id: string;
    nombre: string;
    geometry?: PotreroGeometry[]; // ✅ nunca null
  }>;

  readOnly?: boolean;
}

function calculatePolygonArea(
  paths: google.maps.LatLng[],
  geometry: typeof google.maps.geometry | undefined
): number {
  if (!geometry || paths.length < 3) return 0;
  return Math.abs(geometry.spherical.computeArea(paths));
}

function PotreroMapEditorComponent({
  initialGeometry,
  onPolygonComplete,
  onClose,
  apiKey,
  existingPolygons = [],
  readOnly = false,
}: PotreroMapEditorProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [areaM2, setAreaM2] = useState<number>(0);
  const [areaHa, setAreaHa] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [mapType, setMapType] = useState<"satellite" | "hybrid">("hybrid");

  // refs
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const editablePolygonRef = useRef<google.maps.Polygon | null>(null);
  const existingPolygonsRef = useRef<google.maps.Polygon[]>([]);
  const listenersRef = useRef<google.maps.MapsEventListener[]>([]);

  const currentInitial = useMemo(() => initialGeometry ?? [], [initialGeometry]);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    libraries,
  });

  const clearListeners = useCallback(() => {
    listenersRef.current.forEach((l) => l.remove());
    listenersRef.current = [];
  }, []);

  const clearExistingPolygons = useCallback(() => {
    existingPolygonsRef.current.forEach((p) => p.setMap(null));
    existingPolygonsRef.current = [];
  }, []);

  const clearEditablePolygon = useCallback(() => {
    clearListeners();
    if (editablePolygonRef.current) {
      editablePolygonRef.current.setMap(null);
      editablePolygonRef.current = null;
    }
    setIsEditing(false);
  }, [clearListeners]);

  const clearDrawingManager = useCallback(() => {
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setMap(null);
      drawingManagerRef.current = null;
    }
  }, []);

  // Render inicial + vecinos cada vez que haya map y cambie initialGeometry/existingPolygons/readOnly
  useEffect(() => {
    if (!map || !isLoaded) return;

    // limpiar todo previo
    clearExistingPolygons();
    clearEditablePolygon();
    clearDrawingManager();

    // 1) Dibujar vecinos (read-only)
    if (existingPolygons.length > 0) {
      const rendered: google.maps.Polygon[] = [];

      existingPolygons.forEach((potrero) => {
        if (!potrero.geometry || potrero.geometry.length < 3) return;

        const path = potrero.geometry.map((p) => new google.maps.LatLng(p.lat, p.lng));

        const poly = new google.maps.Polygon({
          paths: path,
          fillColor: "#888888",
          fillOpacity: 0.25,
          strokeColor: "#666666",
          strokeWeight: 1,
          clickable: false,
          editable: false,
          draggable: false,
        });

        poly.setMap(map);
        rendered.push(poly);
      });

      existingPolygonsRef.current = rendered;
    }

    // 2) Dibujar polígono editable/visible inicial si existe
    if (currentInitial.length >= 3) {
      const path = currentInitial.map((p) => new google.maps.LatLng(p.lat, p.lng));

      const poly = new google.maps.Polygon({
        paths: path,
        editable: false,
        draggable: false,
        fillColor: "#3b82f6",
        fillOpacity: 0.35,
        strokeColor: "#1e40af",
        strokeWeight: 2,
      });

      poly.setMap(map);
      editablePolygonRef.current = poly;

      // calcular área
      const area = calculatePolygonArea(path, window.google?.maps?.geometry);
      setAreaM2(area);
      setAreaHa(area / 10000);

      // fit bounds
      const bounds = new google.maps.LatLngBounds();
      path.forEach((ll) => bounds.extend(ll));
      map.fitBounds(bounds);

      return;
    }

    // 3) Si no hay polígono inicial:
    map.setCenter(defaultCenter);
    map.setZoom(6);

    // si readOnly, no permitir dibujar
    if (readOnly) return;

    // 4) Crear DrawingManager para dibujar (create)
    const drawingMgr = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [google.maps.drawing.OverlayType.POLYGON],
      },
      polygonOptions: {
        fillColor: "#3b82f6",
        fillOpacity: 0.35,
        strokeColor: "#1e40af",
        strokeWeight: 2,
        clickable: false,
        editable: false,
        draggable: false,
      },
    });

    drawingMgr.setMap(map);
    drawingManagerRef.current = drawingMgr;

    const listener = drawingMgr.addListener("polygoncomplete", (poly: google.maps.Polygon) => {
      drawingMgr.setDrawingMode(null);

      // si ya había uno, lo removemos
      clearEditablePolygon();

      editablePolygonRef.current = poly;

      const paths = poly.getPath().getArray();
      const geometry: PotreroGeometry[] = paths.map((latlng) => ({
        lat: latlng.lat(),
        lng: latlng.lng(),
      }));

      const area = calculatePolygonArea(paths, window.google?.maps?.geometry);
      setAreaM2(area);
      setAreaHa(area / 10000);

      toast.success("Polígono dibujado correctamente");
    });

    listenersRef.current.push(listener);

    // cleanup si cambia algo
    return () => {
      // no-op aquí: el efecto al re-ejecutar ya limpia arriba
    };
  }, [
    map,
    isLoaded,
    currentInitial,
    existingPolygons,
    readOnly,
    clearExistingPolygons,
    clearEditablePolygon,
    clearDrawingManager,
  ]);

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    mapInstance.setMapTypeId(mapType);
  }, [mapType]);

  const handleEdit = useCallback(() => {
    const poly = editablePolygonRef.current;
    if (!poly) return;

    poly.setEditable(true);
    poly.setDraggable(false);
    setIsEditing(true);

    const path = poly.getPath();

    const updateArea = () => {
      const pts = path.getArray();
      const area = calculatePolygonArea(pts, window.google?.maps?.geometry);
      setAreaM2(area);
      setAreaHa(area / 10000);
    };

    listenersRef.current.push(path.addListener("set_at", updateArea));
    listenersRef.current.push(path.addListener("insert_at", updateArea));
    listenersRef.current.push(path.addListener("remove_at", updateArea));

    toast.info("Modo edición activado. Ajusta los puntos del polígono.");
  }, []);

  const handleReset = useCallback(() => {
    if (readOnly) return;
    clearEditablePolygon();
    setAreaM2(0);
    setAreaHa(0);

    if (map) {
      // re-habilitar modo dibujo si existe drawing manager
      if (!drawingManagerRef.current) {
        const drawingMgr = new google.maps.drawing.DrawingManager({
          drawingMode: google.maps.drawing.OverlayType.POLYGON,
          drawingControl: true,
          drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER,
            drawingModes: [google.maps.drawing.OverlayType.POLYGON],
          },
          polygonOptions: {
            fillColor: "#3b82f6",
            fillOpacity: 0.35,
            strokeColor: "#1e40af",
            strokeWeight: 2,
            clickable: false,
            editable: false,
            draggable: false,
          },
        });

        drawingMgr.setMap(map);
        drawingManagerRef.current = drawingMgr;

        const listener = drawingMgr.addListener("polygoncomplete", (poly: google.maps.Polygon) => {
          drawingMgr.setDrawingMode(null);

          clearEditablePolygon();
          editablePolygonRef.current = poly;

          const paths = poly.getPath().getArray();
          const geometry: PotreroGeometry[] = paths.map((latlng) => ({
            lat: latlng.lat(),
            lng: latlng.lng(),
          }));

          const area = calculatePolygonArea(paths, window.google?.maps?.geometry);
          setAreaM2(area);
          setAreaHa(area / 10000);

          toast.success("Polígono dibujado correctamente");
        });

        listenersRef.current.push(listener);
      } else {
        drawingManagerRef.current.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
      }
    }

    toast.info("Listo para dibujar un nuevo polígono");
  }, [clearEditablePolygon, map, readOnly]);

  const handleSave = useCallback(() => {
    const poly = editablePolygonRef.current;
    if (!poly) {
      toast.error("No hay polígono para guardar");
      return;
    }

    const paths = poly.getPath().getArray();
    if (paths.length < 3) {
      toast.error("El polígono debe tener al menos 3 puntos");
      return;
    }

    const geometry: PotreroGeometry[] = paths.map((latlng) => ({
      lat: latlng.lat(),
      lng: latlng.lng(),
    }));

    const area = calculatePolygonArea(paths, window.google?.maps?.geometry);
    onPolygonComplete(geometry, area, area / 10000);

    // dejarlo no editable después de guardar
    poly.setEditable(false);
    setIsEditing(false);
  }, [onPolygonComplete]);

  const toggleMapType = useCallback(() => {
    const newType = mapType === "satellite" ? "hybrid" : "satellite";
    setMapType(newType);
    if (map) map.setMapTypeId(newType);
  }, [map, mapType]);

  // cleanup al desmontar
  useEffect(() => {
    return () => {
      clearListeners();
      clearExistingPolygons();
      clearEditablePolygon();
      clearDrawingManager();
    };
  }, [clearListeners, clearExistingPolygons, clearEditablePolygon, clearDrawingManager]);

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-red-50 border-red-200">
        <p className="text-red-600 font-medium">Error al cargar Google Maps</p>
        <p className="text-sm text-red-500 mt-2">Verifica que la API key sea válida</p>
        <Button variant="ghost" onClick={onClose} className="mt-4">
          Cerrar
        </Button>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-8 border rounded-lg">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Cargando Google Maps...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {(areaM2 > 0) && (
        <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <MapPin className="h-5 w-5 text-blue-600" />
          <div className="flex-1">
            <div className="text-sm font-medium text-blue-900">Área calculada</div>
            <div className="text-xs text-blue-700">
              {areaM2.toLocaleString("es-CO", { maximumFractionDigits: 2 })} m² •{" "}
              {areaHa.toLocaleString("es-CO", { maximumFractionDigits: 4 })} ha
            </div>
          </div>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden relative">
        <div className="absolute top-2 right-2 z-10 flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleMapType}
            className="bg-white/95 backdrop-blur-sm shadow-sm hover:bg-white"
          >
            <Layers className="h-4 w-4 mr-2" />
            {mapType === "satellite" ? "Mostrar etiquetas" : "Ocultar etiquetas"}
          </Button>
        </div>

        <GoogleMap
          mapContainerStyle={containerStyle}
          center={
            currentInitial?.[0]
              ? { lat: currentInitial[0].lat, lng: currentInitial[0].lng }
              : defaultCenter
          }
          zoom={currentInitial && currentInitial.length > 0 ? 15 : 6}
          onLoad={onMapLoad}
          options={{
            mapTypeId: mapType,
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: true,
            mapTypeControlOptions: {
              style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
              position: google.maps.ControlPosition.TOP_LEFT,
              mapTypeIds: ["roadmap", "satellite", "hybrid", "terrain"],
            },
            streetViewControl: false,
            fullscreenControl: true,
          }}
        />
      </div>

      {!readOnly && (
        <div className="text-sm text-muted-foreground p-3 bg-gray-50 rounded-lg">
          <p className="font-medium mb-1">Tips:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Dibuja un polígono con la herramienta de arriba (modo creación)</li>
            <li>Si ya existe un polígono, usa “Editar” para ajustar puntos</li>
            {existingPolygons.length > 0 && (
              <li className="text-blue-600">
                Los polígonos grises muestran otros potreros para referencia
              </li>
            )}
          </ul>
        </div>
      )}

      {readOnly && (
        <div className="text-sm text-muted-foreground p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="font-medium mb-1 text-blue-900">Modo de visualización</p>
          <p className="text-xs text-blue-700">
            Este potrero se muestra en modo de solo lectura.
            {existingPolygons.length > 0 && " Los polígonos grises muestran otros potreros para contexto."}
          </p>
        </div>
      )}

      {!readOnly && (
        <div className="flex justify-between items-center gap-2 pt-2 border-t">
          <div className="flex gap-2">
            {!!editablePolygonRef.current && !isEditing && (
              <Button type="button" variant="outline" onClick={handleEdit} size="sm">
                <Edit2 className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}

            {!!editablePolygonRef.current && (
              <Button type="button" variant="outline" onClick={handleReset} size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Borrar y volver a dibujar
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose} size="sm">
              Cerrar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!editablePolygonRef.current}
              size="sm"
            >
              Guardar polígono
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PotreroMapEditor(props: PotreroMapEditorProps) {
  if (!props.apiKey || props.apiKey.trim() === "") {
    return (
      <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-yellow-50 border-yellow-200">
        <p className="text-yellow-700 font-medium">API Key de Google Maps no configurada</p>
        <p className="text-sm text-yellow-600 mt-2">
          Configura NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en las variables de entorno
        </p>
        <Button variant="ghost" onClick={props.onClose} className="mt-4">
          Cerrar
        </Button>
      </div>
    );
  }

  return <PotreroMapEditorComponent {...props} />;
}
