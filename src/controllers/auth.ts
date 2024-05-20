import { IAuth } from '@types'
import Elysia, { t } from 'elysia'
import { Users, db } from '@database'
import { eq } from 'drizzle-orm'
import { StatusCode } from 'status-code-enum'
import jwt from 'jsonwebtoken'
import * as bcrypt from 'bcryptjs'

export const authController = (es: Elysia) => {
  es.group('/auth', (app) =>
    app
      .get('/health', () => 'Ok')
      .post(
        '/sign-in',
        async ({ body }) => {
          const { email, password } = body as {
            email: string
            password: string
          }

          const users = await db
            .select()
            .from(Users)
            .where(eq(Users.email, email))
            .execute()

          if (users.length === 0) {
            throw new Error('User not found')
          }

          const user = users[0]

          const passwordIsValid = await bcrypt.compare(password, user.password)

          if (!passwordIsValid) {
            throw new Error('Credentials are not valid')
          }

          const tokenPayload: IAuth.TokenPayload = {
            user_id: user.id
          }

          const privateKey = await Bun.file('./certs/jwtRS256.key', {
            type: 'utf8'
          }).text()

          const access_token = jwt.sign(tokenPayload, privateKey, {
            algorithm: 'RS256',
            expiresIn: '1h'
          })
          const refresh_token = jwt.sign(tokenPayload, privateKey, {
            algorithm: 'RS256',
            expiresIn: '1d'
          })

          return {
            access_token,
            refresh_token
          }
        },
        {
          body: t.Object({
            email: t.String(),
            password: t.String()
          })
        }
      )
      .post(
        '/sign-up',
        async ({ set, body }) => {
          const { email, password } = body as {
            email: string
            password: string
          }

          const result = await db
            .select()
            .from(Users)
            .where(eq(Users.email, email))
            .execute()

          if (result.length > 0) {
            set.status = StatusCode.ClientErrorBadRequest
            throw new Error('Email already exists')
          }

          const newUserRes = await db.insert(Users).values({
            email,
            password: await bcrypt.hash(password, 10)
          })

          return {
            message: 'User created',
            user_id: newUserRes[0].insertId
          }
        },
        {
          body: t.Object({
            email: t.String(),
            password: t.String()
          })
        }
      )
  )

  return es
}