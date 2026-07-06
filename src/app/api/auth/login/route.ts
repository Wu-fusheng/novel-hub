import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { email, password, autoRegister, role, metadata } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: '邮箱和密码不能为空' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // setAll may fail in Server Component context;
              // we handle via response headers below
            }
          },
        },
      }
    )

    let loginResult = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    // If login failed and autoRegister is enabled, try to sign up first
    if (loginResult.error && autoRegister) {
      const errMsg = loginResult.error.message || ''
      if (errMsg.includes('Invalid login') || errMsg.includes('User not found')) {
        const signUpResult = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              email,
              role: role || 'author',
              ...(metadata || {}),
            },
          },
        })
        if (!signUpResult.error) {
          // Try login again after successful registration
          loginResult = await supabase.auth.signInWithPassword({
            email,
            password,
          })
        }
      }
    }

    if (loginResult.error) {
      return NextResponse.json(
        { success: false, error: loginResult.error.message },
        { status: 401 }
      )
    }

    const data = loginResult.data

    // Fetch user profile from profiles table
    let profile = null
    if (data.user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
      profile = profileData || null
    }

    const session = data.session
    const response = NextResponse.json({
      success: true,
      session: session
        ? {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_in: session.expires_in,
            expires_at: session.expires_at,
          }
        : null,
      user: data.user
        ? {
            id: data.user.id,
            email: data.user.email,
            user_metadata: data.user.user_metadata,
          }
        : null,
      profile,
    })

    // Set session cookies for SSR middleware to pick up
    if (session) {
      const allCookies = cookieStore.getAll()
      for (const cookie of allCookies) {
        if (cookie.name.startsWith('sb-')) {
          response.cookies.set(cookie.name, cookie.value, {
            path: '/',
            sameSite: 'lax',
            secure: false,
            httpOnly: false,
          })
        }
      }
    }

    return response
  } catch (err) {
    console.error('Auth proxy error:', err)
    return NextResponse.json(
      { success: false, error: '登录请求处理失败' },
      { status: 500 }
    )
  }
}
