import { NextResponse } from "next/server"
import { adminAuth, adminDb, FieldValue } from "@/lib/firebase-admin"

export const runtime = "nodejs"

type RestaurantSettings = {
  restaurantName: string
  phone: string
  email: string
  address: string
  openTime: string
  closeTime: string
}

async function getBearerUid(req: Request): Promise<string> {
  const auth = req.headers.get("authorization") || ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null
  if (!token) throw new Error("Missing Authorization header")
  const decoded = await adminAuth.verifyIdToken(token)
  return decoded.uid
}

async function assertIsAdmin(uid: string) {
  const snap = await adminDb.doc(`users/${uid}`).get()
  if (!snap.exists) throw new Error("User profile not found")
  const role = (snap.data() as any)?.role
  if (role !== "admin") throw new Error("Only admin can access settings")
}

export async function GET(req: Request) {
  try {
    const uid = await getBearerUid(req)
    await assertIsAdmin(uid)

    // Fetches restaurant data from restaurants/{ownerUid}
    // Note: Assuming the restaurant document might not exist initially, we return null or default
    const snap = await adminDb.doc(`restaurants/${uid}`).get()
    
    if (!snap.exists) {
        return NextResponse.json({})
    }

    return NextResponse.json(snap.data())
  } catch (e: any) {
    const msg = e?.message || "Failed to fetch settings"
    const code = /Authorization|Missing|admin/i.test(msg) ? 401 : 500
    return new NextResponse(msg, { status: code })
  }
}

export async function POST(req: Request) {
  try {
    const uid = await getBearerUid(req)
    await assertIsAdmin(uid)

    const body = (await req.json()) as RestaurantSettings
    
    await adminDb.doc(`restaurants/${uid}`).set({
        ...body,
        updatedAt: FieldValue.serverTimestamp()
    }, { merge: true })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    const msg = e?.message || "Failed to update settings"
    const code = /Authorization|Missing|admin/i.test(msg) ? 401 : 500
    return new NextResponse(msg, { status: code })
  }
}
