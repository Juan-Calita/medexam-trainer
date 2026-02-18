import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    // Allow CORS for external sites like Render
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
        const base44 = createClientFromRequest(req);
        const progress = await base44.asServiceRole.entities.GameProgress.list('-created_date', 100);

        return Response.json({ success: true, data: progress }, { headers: corsHeaders });
    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
    }
});