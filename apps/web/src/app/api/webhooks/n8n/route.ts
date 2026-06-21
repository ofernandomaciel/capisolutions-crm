import { NextRequest, NextResponse } from 'next/server'

/**
 * Incoming webhook receiver for n8n.
 * n8n can POST to this endpoint to trigger actions inside the CRM.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('[n8n Webhook]', JSON.stringify(body, null, 2))

    // TODO: Handle n8n-triggered actions
    // e.g. create a lead, send a task notification, etc.

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[n8n Webhook] error:', err)
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'n8n webhook endpoint active' })
}
