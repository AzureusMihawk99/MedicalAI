import { openai } from "@/config/OpenAiModel";
import { AIDoctorAgents } from "@/shared/list";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { notes } = await req.json();
    try {
        const completion = await openai.chat.completions.create({
            model: "google/gemini-flash-1.5",
            messages: [
                { role: 'system', content: JSON.stringify(AIDoctorAgents) },
                { role: "user", content: "User Notes/Symptoms:" + notes + ", Depends on user notes and symptoms, Please suggest list of doctors , Return Object in JSON only" }
            ],
        });

        const rawResp = completion.choices[0].message;

        //@ts-ignore
        const Resp = rawResp.content.trim().replace('```json', '').replace('```', '')
        const JSONResp = JSON.parse(Resp);

        return NextResponse.json(JSONResp);
    } catch (e) {
        console.error('Error in suggest-doctors API:', e);
        return NextResponse.json({
            error: 'Failed to generate doctor suggestions',
            details: e instanceof Error ? e.message : 'Unknown error'
        }, { status: 500 });
    }
}
