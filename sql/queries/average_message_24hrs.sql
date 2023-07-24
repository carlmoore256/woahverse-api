WITH avg_vector AS (
    SELECT AVG(embedding) AS average_embedding
    FROM messages
    WHERE created_at >= now() - interval '24 hours'
)

SELECT 
    m.id, 
    m.message, 
    m.created_at, 
    m.role,
    m.embedding <-> av.average_embedding AS distance_to_avg
FROM 
    messages m, avg_vector av
WHERE 
    m.created_at >= now() - interval '24 hours'
AND
    m.role = 'human'
ORDER BY 
    m.embedding <-> av.average_embedding
LIMIT 10;
