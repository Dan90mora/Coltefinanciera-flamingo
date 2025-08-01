import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function checkVidaDeudorData() {
    console.log("🔍 VERIFICANDO DATOS EN TABLA ASISTENCIAVIDA_DOCUMENTS");
    console.log("======================================================\n");
    
    const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_KEY!
    );
    
    try {
        // 1. Verificar si la tabla existe y tiene datos
        console.log("1️⃣ Verificando existencia de tabla y conteo de registros...");
        const { data: countData, error: countError } = await supabase
            .from('asistenciavida_documents')
            .select('*', { count: 'exact', head: true });
            
        if (countError) {
            console.error("❌ Error verificando tabla:", countError);
            return;
        }
        
        console.log(`✅ Tabla existe. Total de documentos: ${countData?.length || 0}\n`);
        
        // 2. Buscar documentos que contengan "propuesta económica"
        console.log("2️⃣ Buscando documentos con 'propuesta económica'...");
        const { data: economicData, error: economicError } = await supabase
            .from('asistenciavida_documents')
            .select('*')
            .textSearch('content', 'propuesta económica');
            
        if (economicError) {
            console.error("❌ Error buscando propuesta económica:", economicError);
        } else {
            console.log(`📊 Documentos con 'propuesta económica': ${economicData?.length || 0}`);
            if (economicData && economicData.length > 0) {
                console.log("📄 Primer documento encontrado:");
                console.log(economicData[0].content.substring(0, 500) + "...\n");
            }
        }
        
        // 3. Buscar documentos que contengan "vida deudor"
        console.log("3️⃣ Buscando documentos con 'vida deudor'...");
        const { data: vidaData, error: vidaError } = await supabase
            .from('asistenciavida_documents')
            .select('*')
            .textSearch('content', 'vida deudor');
            
        if (vidaError) {
            console.error("❌ Error buscando vida deudor:", vidaError);
        } else {
            console.log(`📊 Documentos con 'vida deudor': ${vidaData?.length || 0}`);
            if (vidaData && vidaData.length > 0) {
                console.log("📄 Primer documento encontrado:");
                console.log(vidaData[0].content.substring(0, 500) + "...\n");
            }
        }
        
        // 4. Buscar documentos que contengan "precio" o "costo"
        console.log("4️⃣ Buscando documentos con información de precios...");
        const { data: priceData, error: priceError } = await supabase
            .from('asistenciavida_documents')
            .select('*')
            .or('content.ilike.%precio%,content.ilike.%costo%,content.ilike.%tarifa%,content.ilike.%valor%');
            
        if (priceError) {
            console.error("❌ Error buscando precios:", priceError);
        } else {
            console.log(`📊 Documentos con información de precios: ${priceData?.length || 0}`);
            if (priceData && priceData.length > 0) {
                console.log("📄 Primer documento con precios:");
                console.log(priceData[0].content.substring(0, 500) + "...\n");
            }
        }
        
        // 5. Verificar si existen las funciones necesarias
        console.log("5️⃣ Verificando funciones de búsqueda...");
        try {
            const { data: funcData, error: funcError } = await supabase.rpc('search_asistenciavida_documents_hybrid', {
                query_text: 'test',
                query_embedding: new Array(1536).fill(0.1),
                match_threshold: 0.1,
                match_count: 1,
                rrf_k: 60
            });
            
            if (funcError) {
                console.error("❌ Función search_asistenciavida_documents_hybrid NO existe:", funcError);
                console.log("⚠️ NECESITAS EJECUTAR: supabase_asistenciavida_setup.sql");
            } else {
                console.log("✅ Función search_asistenciavida_documents_hybrid funciona correctamente");
            }
        } catch (error) {
            console.error("❌ Error probando función:", error);
        }
        
    } catch (error) {
        console.error("❌ Error general:", error);
    }
}

// Ejecutar verificación
checkVidaDeudorData().catch(console.error);
