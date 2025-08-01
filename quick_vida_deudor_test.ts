import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function quickTest() {
    console.log("🚀 PRUEBA RÁPIDA DE VIDA DEUDOR");
    console.log("==============================");
    
    const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_KEY!
    );
    
    try {
        console.log("🔍 1. Verificando si existe la tabla asistenciavida_documents...");
        
        // Intentar hacer una consulta básica
        const { data, error } = await supabase
            .from('asistenciavida_documents')
            .select('count', { count: 'exact', head: true });
            
        if (error) {
            console.error("❌ La tabla NO existe o hay un error:", error.message);
            console.log("\n💡 SOLUCIÓN: Ejecutar el script supabase_asistenciavida_setup.sql");
            return;
        }
        
        console.log("✅ Tabla existe");
        
        // Si la tabla existe, probar búsqueda de texto
        console.log("\n🔍 2. Probando búsqueda de texto en la tabla...");
        const { data: searchData, error: searchError } = await supabase
            .from('asistenciavida_documents')
            .select('*')
            .limit(1);
            
        if (searchError) {
            console.error("❌ Error en búsqueda:", searchError.message);
        } else {
            console.log(`✅ Datos encontrados: ${searchData?.length || 0} registros`);
            if (searchData && searchData.length > 0) {
                console.log("📄 Ejemplo de contenido:", searchData[0].content?.substring(0, 100) + "...");
            }
        }
        
        // Probar búsqueda específica de tarifas
        console.log("\n🔍 3. Probando búsqueda específica de tarifas...");
        const { data: tariffData, error: tariffError } = await supabase
            .from('asistenciavida_documents')
            .select('*')
            .or('content.ilike.%tarifa mes%,content.ilike.%tarifa completa%,content.ilike.%propuesta económica%');
            
        if (tariffError) {
            console.error("❌ Error buscando tarifas:", tariffError.message);
        } else {
            console.log(`✅ Documentos con tarifas: ${tariffData?.length || 0}`);
            if (tariffData && tariffData.length > 0) {
                console.log("💰 Contenido de tarifa encontrado:", tariffData[0].content?.substring(0, 200) + "...");
            }
        }
        
    } catch (e) {
        console.error("💥 Error general:", e);
    }
}

quickTest().catch(console.error);
