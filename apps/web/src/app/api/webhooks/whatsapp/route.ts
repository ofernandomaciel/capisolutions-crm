import { NextRequest, NextResponse } from 'next/server'

/**
 * Webhook receiver for Evolution API (WhatsApp).
 * Configure this URL in your Evolution API instance webhook settings.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('[WhatsApp Webhook]', JSON.stringify(body, null, 2))

    // TODO: Handle incoming WhatsApp events
    // body.event: 'messages.upsert' | 'connection.update' | etc.
    // body.data.key.remoteJid = sender phone
    // body.data.message.conversation = message text

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[WhatsApp Webhook] error:', err)
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'WhatsApp webhook endpoint active' })
}
