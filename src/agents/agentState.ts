import { END, Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

// Tipo para datos de seguro vehicular
export interface VehicleInsuranceData {
  fullName: string | null;
  cedula: string | null;
  birthDate: string | null;
  phone: string | null;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  vehicleYear: string | null;
  vehiclePlate: string | null;
  vehicleCity: string | null;
}

// Tipo para datos de seguro de mascotas
export interface MascotaInsuranceData {
  fullName: string | null;
  cedula: string | null;
  birthDate: string | null;
  phone: string | null;
  petName: string | null;
  petType: string | null; // perro, gato, etc.
  petBreed: string | null;
  petAge: string | null;
  petWeight: string | null;
  city: string | null;
}

export const AgentState = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
      reducer: (x, y) => x.concat(y),
      default: () => [],
    }),
    isClientIdentified: Annotation<boolean>({
      reducer: (x, y) => y,
      default: () => false,
    }),
    next: Annotation<string>({
      reducer: (x, y) => y ?? x ?? END,
      default: () => END,
    }),
    vehicleInsuranceData: Annotation<VehicleInsuranceData | null>({
      reducer: (x, y) => y ?? x ?? null,
      default: () => null,
    }),
    mascotaInsuranceData: Annotation<MascotaInsuranceData | null>({
      reducer: (x, y) => y ?? x ?? null,
      default: () => null,
    }),
});

// Explicación de código:
// --------------------------------
// AgentState es una anotación que contiene el estado de un agente en particular.
// En este caso, el estado de un agente es una lista de mensajes y el siguiente mensaje a enviar.
// El estado de un agente es un objeto que contiene dos propiedades:
// - messages: una lista de mensajes que el agente ha recibido.
// - next: el siguiente mensaje que el agente enviará.
// Ambas propiedades son anotaciones que contienen valores de tipo específico.