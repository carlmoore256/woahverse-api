-- selects messages where the message and subsequent response are the furthest apart in vector space
WITH ordered_messages AS (
  SELECT
    id, 
    message, 
    created_at, 
    role, 
    embedding,
    LAG(embedding) OVER (ORDER BY created_at) AS previous_embedding
  FROM 
    messages
  WHERE 
    created_at >= NOW() - INTERVAL '24 hours'
  AND 
    role = 'human'
),

vector_differences AS (
  SELECT 
    id, 
    message, 
    created_at, 
    role, 
    embedding, 
    previous_embedding,
    CASE 
      WHEN previous_embedding IS NOT NULL THEN
        embedding <-> previous_embedding
      ELSE
        NULL
    END AS difference
  FROM 
    ordered_messages
)

SELECT * 
FROM vector_differences
WHERE difference IS NOT NULL
ORDER BY difference DESC
LIMIT 10;