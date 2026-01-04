import { NextResponse } from "next/server"
import { adminAuth, adminDb, FieldValue } from "@/lib/firebase-admin"
export const runtime = "nodejs"

type Body = {
  name: string
  email: string
  password?: string
  role: "waiter" | "kitchen" | "admin"
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
  if (role !== "admin") throw new Error("Only admin can create staff")
}

export async function POST(req: Request) {
  try {
    const ownerUid = await getBearerUid(req)
    await assertIsAdmin(ownerUid)

    const body = (await req.json()) as Body
    const { name, email, password, role } = body

    if (!name || !email || !role) {
      return new NextResponse("Missing required fields", { status: 400 })
    }
    if (!["waiter", "kitchen"].includes(role)) {
      return new NextResponse("Only waiter or kitchen staff can be created", { status: 400 })
    }

    // Create Firebase Auth user for staff
    const userRecord = await adminAuth.createUser({
      displayName: name,
      email,
      password: password && password.length >= 6 ? password : undefined,
    })

    const staffUid = userRecord.uid
    const now = FieldValue.serverTimestamp()

    // users/{staffUid}
    await adminDb.doc(`users/${staffUid}`).set({
      name,
      email,
      role, // keep role value as 'waiter' | 'kitchen'
      ownerId: ownerUid,
      createdAt: now,
    })

    // restaurants/{ownerUid}/(waiters|kitchen-staff)/{staffUid}
    const subPath = role === "waiter" ? "waiters" : "kitchen-staff"
    await adminDb.doc(`restaurants/${ownerUid}/${subPath}/${staffUid}`).set({
      name,
      email,
      role,
      createdAt: now,
    })

    return NextResponse.json({ uid: staffUid })
  } catch (e: any) {
    const msg = e?.message || "Failed to create staff"
    const code = /Authorization|Missing|admin/i.test(msg) ? 401 : 500
    return new NextResponse(msg, { status: code })
  }
}