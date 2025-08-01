import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function debugTariffContent() {
    console.log("🔍 ANALIZANDO CONTENIDO EXACTO DE TARIFAS");
    console.log("=======================================");
    
    const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_KEY!
    );
    
    try {
        // Buscar documentos que contengan las frases exactas de tarifas
        const { data, error } = await supabase
            .from('asistenciavida_documents')
            .select('*')
            .ilike('content', '%Tarifa mes / persona%');
            
        if (error) {
            console.error("❌ Error:", error);
            return;
        }
        
        if (data && data.length > 0) {
            console.log(`✅ Encontrado ${data.length} documento(s) con tarifas`);
            
            data.forEach((doc, index) => {
                console.log(`\n📄 DOCUMENTO ${index + 1}:`);
                console.log("ID:", doc.id);
                console.log("CONTENIDO COMPLETO:");
                console.log("=" .repeat(80));
                console.log(doc.content);
                console.log("=" .repeat(80));
                
                // Analizar el contenido línea por línea
                const lines = doc.content.split('\n');
                console.log(`\n📋 ANÁLISIS LÍNEA POR LÍNEA (${lines.length} líneas):`);
                
                lines.forEach((line, lineIndex) => {
                    const cleanLine = line.trim();
                    if (cleanLine) {
                        console.log(`${String(lineIndex + 1).padStart(3)}: "${cleanLine}"`);
                        
                        // Buscar líneas que contengan las frases clave
                        if (cleanLine.includes('Tarifa mes') || 
                            cleanLine.includes('Tarifa completa') || 
                            cleanLine.includes('Tarifa propuesta')) {
                            console.log(`     ⭐ FRASE CLAVE ENCONTRADA!`);
                        }
                        
                        // Buscar líneas que contengan números/precios
                        if (/\$\d+/.test(cleanLine) || /\d+/.test(cleanLine)) {
                            console.log(`     💰 POSIBLE PRECIO: "${cleanLine}"`);
                        }
                    }
                });
                
                console.log("\n" + "=".repeat(80));
            });
        } else {
            console.log("❌ No se encontraron documentos con tarifas");
        }
        
    } catch (e) {
        console.error("💥 Error:", e);
    }
}

debugTariffContent().catch(console.error);
