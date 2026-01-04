import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

export const runtime = "nodejs"

type Body = {
  staffUid: string
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
  if (!snap.exists) throw new Error("Requester user profile not found")
  const role = (snap.data() as any)?.role
  if (role !== "admin") throw new Error("Only admin can delete staff")
}

export async function POST(req: Request) {
  try {
    const ownerUid = await getBearerUid(req)
    await assertIsAdmin(ownerUid)

    const body = (await req.json()) as Body
    const { staffUid } = body
    if (!staffUid) return new NextResponse("Missing staffUid", { status: 400 })

    // Delete from Firebase Authentication
    await adminAuth.deleteUser(staffUid)

    // Delete Firestore docs
    const batch = adminDb.batch()
    batch.delete(adminDb.doc(`users/${staffUid}`))
    // Delete from both role-based collections in case role changed
    batch.delete(adminDb.doc(`restaurants/${ownerUid}/waiters/${staffUid}`))
    batch.delete(adminDb.doc(`restaurants/${ownerUid}/kitchen-staff/${staffUid}`))
    await batch.commit()

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    const msg = e?.message || "Failed to delete staff"
    const code = /Authorization|Missing|admin/i.test(msg) ? 401 : 500
    return new NextResponse(msg, { status: code })
  }
}