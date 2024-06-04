import axiosistCtor from 'axiosist'
import Express from 'express'
import assert from 'node:assert'
import { randomUUID } from 'node:crypto'
import { describe, it, TestContext } from 'node:test'
import { Class, ClassCreationType, ClassUpdateType } from '../domain/Class.js'
import { ClassService } from '../services/ClassService.js'
import { classId, dummyClass, dummyStudent, dummyTeacher, teacherId } from '../utils/fixtures/mocks.js'
import { classRouterFactory } from './class.js'
import { errorHandler } from './middlewares/errorHandler.js'
import { NotFoundError } from '../domain/Errors/NotFound.js'
import { ConflictError } from '../domain/Errors/Conflict.js'
import { Teacher } from '../domain/Teacher.js'
import { DependencyConflictError } from '../domain/Errors/DependencyConflict.js'
import { Student } from '../domain/Student.js'
import { MissingDependencyError } from '../domain/Errors/MissingDependency.js'
const axiosist = axiosistCtor.default

const classServiceMockFactory = (
  t: TestContext,
  methodReturns: { [T in keyof ClassService]?: ReturnType<ClassService[T]> } = {}
) => ({
  findById: t.mock.fn((id: string) => methodReturns['findById'] ?? dummyClass({ id })),
  list: t.mock.fn(() => methodReturns['list'] ?? [dummyClass({ id: classId })]),
  getTeacher: t.mock.fn((_classId: string) => methodReturns['getTeacher'] ?? dummyTeacher({ id: teacherId })),
  getStudents: t.mock.fn((_classId: string) => methodReturns['getStudents'] ?? [dummyStudent({ id: randomUUID() })]),
  remove: t.mock.fn((_id: string) => methodReturns['remove'] ?? t.mock.fn()),
  create: t.mock.fn((_class: ClassCreationType) => methodReturns['create'] ?? dummyClass(_class)),
  update: t.mock.fn(
    (_id: string, _values: ClassUpdateType) => methodReturns['update'] ?? dummyClass({ ..._values, id: _id })
  )
})

function getApp(classService: ClassService) {
  const app = Express()
  app.use(Express.json())
  app.use('/classes', classRouterFactory(classService))
  app.use(errorHandler)
  return app
}

describe('classRouterFactory', () => {
  describe('GET /:id', () => {
    it('should return a class', async (t) => {
      const classService = classServiceMockFactory(t)

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).get(
        `/classes/${classId}`
      )

      assert.strictEqual(status, 200)
      assert.deepStrictEqual(data, dummyClass({ id: classId }).toObject())
    })

    it('should 404 if no class', async (t) => {
      const classService = classServiceMockFactory(t)
      classService.findById.mock.mockImplementationOnce(() => {
        throw new NotFoundError(classId, Class)
      })

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).get(
        `/classes/${classId}`
      )
      assert.strictEqual(status, 404)
      assert.deepStrictEqual(data, {
        code: 'NOT_FOUND',
        message: `Class with locator "${classId}" could not be found`,
        name: 'ClassError'
      })
    })

    it('should 500 if any other error', async (t) => {
      const classService = classServiceMockFactory(t)
      classService.findById.mock.mockImplementationOnce(() => {
        throw new Error('boo')
      })

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).get(
        `/classes/${classId}`
      )
      assert.strictEqual(status, 500)
      assert.strictEqual(data.code, 'UNKNOWN_ERROR')
    })
  })

  describe('GET /:id/students', () => {
    it('should return the student list', async (t) => {
      const classService = classServiceMockFactory(t)

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).get(
        `/classes/${classId}/students`
      )
      assert.strictEqual(status, 200)
      assert.ok(Array.isArray(data))
      assert.ok(data.every((student: Student) => !!student.bloodType))
    })

    it('should return empty list when no students', async (t) => {
      const classService = classServiceMockFactory(t)
      classService.getStudents.mock.mockImplementationOnce(() => [])

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).get(
        `/classes/${classId}/students`
      )
      assert.strictEqual(status, 200)
      assert.ok(Array.isArray(data))
      assert.strictEqual(data.length, 0)
    })

    it('should 404 if no class', async (t) => {
      const classService = classServiceMockFactory(t)
      classService.getStudents.mock.mockImplementationOnce(() => {
        throw new NotFoundError(classId, Class)
      })

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).get(
        `/classes/${randomUUID()}/students`
      )
      assert.strictEqual(status, 404)
      assert.deepStrictEqual(data, {
        code: 'NOT_FOUND',
        message: `Class with locator "${classId}" could not be found`,
        name: 'ClassError'
      })
    })

    it('should 500 if any other error', async (t) => {
      const classService = classServiceMockFactory(t)
      classService.getStudents.mock.mockImplementationOnce(() => {
        throw new Error('boo')
      })

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).get(
        `/classes/${classId}/students`
      )
      assert.strictEqual(status, 500)
      assert.strictEqual(data.code, 'UNKNOWN_ERROR')
    })
  })

  describe('GET /:id/teacher', () => {
    it('should return the teacher', async (t) => {
      const classService = classServiceMockFactory(t)

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).get(
        `/classes/${classId}/teacher`
      )
      assert.strictEqual(status, 200)
      assert.ok(Object.keys(data).includes('major'))
    })

    it('should return 404 when no teacher found', async (t) => {
      const classService = classServiceMockFactory(t)
      classService.getTeacher.mock.mockImplementationOnce(() => {
        throw new MissingDependencyError(Teacher, classId, Class)
      })

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).get(
        `/classes/${classId}/teacher`
      )
      assert.strictEqual(status, 404)
      assert.strictEqual(data.code, 'DEPENDENCY_LOCK')
    })

    it('should 404 if no class', async (t) => {
      const classService = classServiceMockFactory(t)
      classService.getTeacher.mock.mockImplementationOnce(() => {
        throw new NotFoundError(classId, Class)
      })

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).get(
        `/classes/${classId}/teacher`
      )
      assert.strictEqual(status, 404)
      assert.deepStrictEqual(data, {
        code: 'NOT_FOUND',
        message: `Class with locator "${classId}" could not be found`,
        name: 'ClassError'
      })
    })

    it('should 500 if any other error', async (t) => {
      const classService = classServiceMockFactory(t)
      classService.getTeacher.mock.mockImplementationOnce(() => {
        throw new Error('boo')
      })

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).get(
        `/classes/${classId}/teacher`
      )
      assert.strictEqual(status, 500)
      assert.strictEqual(data.code, 'UNKNOWN_ERROR')
    })
  })

  describe('GET /', () => {
    it('should list classes', async (t) => {
      const classService = classServiceMockFactory(t)

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).get(`/classes`)
      assert.strictEqual(status, 200)
      assert.deepStrictEqual(data, [dummyClass({ id: classId }).toObject()])
    })

    it('should return empty on no classes', async (t) => {
      const classService = classServiceMockFactory(t)
      classService.list.mock.mockImplementationOnce(() => [])

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).get(`/classes`)
      assert.strictEqual(status, 200)
      assert.deepStrictEqual(data, [])
    })
  })

  describe('POST /', () => {
    it('should return a class', async (t) => {
      const classService = classServiceMockFactory(t)

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).post(`/classes`, {
        code: '1B-M',
        teacher: teacherId
      })

      assert.strictEqual(status, 201)
      assert.ok(Object.keys(data).length === 3)
      assert.strictEqual(data.code, '1B-M')
      assert.strictEqual(data.teacher, teacherId)
      assert.match(data.id, /^[0-9a-f-]{36}$/)
    })

    it('should 500 if any other error', async (t) => {
      const classService = classServiceMockFactory(t)
      classService.create.mock.mockImplementationOnce(() => {
        throw new Error('boo')
      })

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).post(`/classes/`, {
        code: '1B-M',
        teacher: null
      })
      assert.strictEqual(status, 500)
      assert.strictEqual(data.code, 'UNKNOWN_ERROR')
    })

    it('should 422 on validation error', async (t) => {
      const classService = classServiceMockFactory(t)

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).post(`/classes/`, {
        code: '1B-M'
      })
      assert.strictEqual(status, 422)
      assert.strictEqual(data.name, 'ZodError')
    })

    it('should 409 on conflict error', async (t) => {
      const classService = classServiceMockFactory(t)
      classService.create.mock.mockImplementationOnce((creationData: ClassCreationType) => {
        throw new ConflictError(creationData.code, Class)
      })

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).post(`/classes/`, {
        code: '1B-M',
        teacher: null
      })
      assert.strictEqual(status, 409)
      assert.strictEqual(data.code, 'CONFLICT')
    })

    it('should 404 on teacher not found', async (t) => {
      const classService = classServiceMockFactory(t)
      classService.create.mock.mockImplementationOnce((creationData: ClassCreationType) => {
        throw new NotFoundError(creationData.teacher, Teacher)
      })

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).post(`/classes/`, {
        code: '1B-M',
        teacher: randomUUID()
      })
      assert.strictEqual(status, 404)
      assert.strictEqual(data.code, 'NOT_FOUND')
    })
  })

  describe('PUT /:id', () => {
    it('should return a class', async (t) => {
      const classService = classServiceMockFactory(t)

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).put(
        `/classes/${classId}`,
        {
          code: '1C-M'
        }
      )

      assert.strictEqual(status, 200)
      assert.ok(Object.keys(data).length === 3)
      assert.strictEqual(data.code, '1C-M')
      assert.strictEqual(data.teacher, teacherId)
      assert.match(data.id, /^[0-9a-f-]{36}$/)
    })

    it('should 500 if any other error', async (t) => {
      const classService = classServiceMockFactory(t)
      classService.update.mock.mockImplementationOnce(() => {
        throw new Error('boo')
      })

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).put(
        `/classes/${classId}`,
        {
          code: '1B-M',
          teacher: null
        }
      )
      assert.strictEqual(status, 500)
      assert.strictEqual(data.code, 'UNKNOWN_ERROR')
    })

    it('should 404 on teacher not found', async (t) => {
      const classService = classServiceMockFactory(t)
      classService.update.mock.mockImplementationOnce((creationData: ClassUpdateType) => {
        throw new NotFoundError(creationData.teacher, Teacher)
      })

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).put(
        `/classes/${classId}`,
        {
          code: '1B-M',
          teacher: randomUUID()
        }
      )
      assert.strictEqual(status, 404)
      assert.strictEqual(data.code, 'NOT_FOUND')
    })
  })

  describe('DELETE /:id', () => {
    it('should return a class', async (t) => {
      const classService = classServiceMockFactory(t)

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).delete(
        `/classes/${classId}`
      )

      assert.strictEqual(status, 204)
      assert.strictEqual(data, '')
    })

    it('should 500 if any other error', async (t) => {
      const classService = classServiceMockFactory(t)
      classService.remove.mock.mockImplementationOnce(() => {
        throw new Error('boo')
      })

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).delete(
        `/classes/${classId}`
      )
      assert.strictEqual(status, 500)
      assert.strictEqual(data.code, 'UNKNOWN_ERROR')
    })

    it('should 403 if tries to delete with students', async (t) => {
      const classService = classServiceMockFactory(t)
      classService.remove.mock.mockImplementationOnce(() => {
        throw new DependencyConflictError(Student, 'something', Class)
      })

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).delete(
        `/classes/${classId}`
      )
      assert.strictEqual(status, 403)
      assert.strictEqual(data.code, 'DEPENDENCY_LOCK')
    })
  })
})
