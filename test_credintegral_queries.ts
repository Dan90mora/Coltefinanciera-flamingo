// Script para probar consultas específicas sobre Credintegral
// Simula consultas reales que haría un cliente
import { searchCredintegralVectors } from './src/functions/retrievers';

async function testCredintegralQueries() {
    console.log('🧪 PRUEBA DE CONSULTAS REALES SOBRE CREDINTEGRAL\n');
    
    const testQueries = [
        "¿Cuánto cuesta el seguro de Credintegral?",
        "¿Qué cubre el seguro de Credintegral?",
        "propuesta económica Credintegral",
        "teleconsulta médica",
        "beneficios del seguro",
        "precio del seguro",
        "cobertura médica",
        "servicios incluidos"
    ];
    
    for (let i = 0; i < testQueries.length; i++) {
        const query = testQueries[i];
        console.log(`\n🔍 CONSULTA ${i + 1}: "${query}"`);
        console.log('=' + '='.repeat(50));
        
        try {
            const results = await searchCredintegralVectors(query);
            
            if (results && results.length > 0) {
                console.log(`✅ Encontrados ${results.length} resultados:`);
                
                results.slice(0, 2).forEach((result, index) => {
                    console.log(`\n📄 Resultado ${index + 1}:`);
                    console.log(`   ID: ${result.id}`);
                    console.log(`   Rank/Similarity: ${result.final_rank || result.similarity}`);
                    console.log(`   Contenido: ${result.content.substring(0, 200)}...`);
                    
                    if (result.metadata) {
                        console.log(`   Fuente: ${JSON.parse(result.metadata).source || 'N/A'}`);
                    }
                });
            } else {
                console.log('❌ No se encontraron resultados');
            }
            
        } catch (error) {
            console.error(`❌ Error en la consulta: ${error}`);
        }
        
        // Pausa pequeña entre consultas
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n🎯 RESUMEN DE LA PRUEBA:');
    console.log('=' + '='.repeat(30));
    console.log('✅ Si ves resultados arriba, la búsqueda vectorial está funcionando');
    console.log('✅ Los contenidos deben ser relevantes a cada consulta');
    console.log('✅ Las fuentes deben apuntar a documentos .docx de Credintegral');
    console.log('\n💡 Si las respuestas no son relevantes, puede necesitar:');
    console.log('   - Ajustar el umbral de similitud');
    console.log('   - Revisar la calidad de los documentos cargados');
    console.log('   - Verificar que los embeddings se generaron correctamente');
}

// Ejecutar pruebas
testCredintegralQueries().then(() => {
    console.log('\n🏁 Pruebas completadas');
    process.exit(0);
}).catch(error => {
    console.error('💥 Error en las pruebas:', error);
    process.exit(1);
});

export {};
