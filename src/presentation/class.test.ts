import { describe, expect, it, jest } from '@jest/globals'
import axiosistCtor from 'axiosist'
import Express from 'express'
import { Class, ClassCreationType, ClassUpdateType } from '../domain/Class.js'
import { ConflictError } from '../domain/Errors/Conflict.js'
import { DependencyConflictError } from '../domain/Errors/DependencyConflict.js'
import { MissingDependencyError } from '../domain/Errors/MissingDependency.js'
import { NotFoundError } from '../domain/Errors/NotFound.js'
import { Student } from '../domain/Student.js'
import { Teacher } from '../domain/Teacher.js'
import { ClassService } from '../services/ClassService.js'
import { classId, dummyClass, dummyStudent, dummyTeacher, studentId, teacherId } from '../utils/fixtures/mocks.js'
import { classRouterFactory } from './class.js'
import { errorHandler } from './middlewares/errorHandler.js'
const axiosist = axiosistCtor.default

const classServiceMockFactory = (methodReturns: { [T in keyof ClassService]?: ReturnType<ClassService[T]> } = {}) => ({
  findById: jest.fn((id: string) => methodReturns['findById'] ?? dummyClass({ id })),
  list: jest.fn(() => methodReturns['list'] ?? [dummyClass({ id: classId })]),
  getTeacher: jest.fn((_classId: string) => methodReturns['getTeacher'] ?? dummyTeacher({ id: teacherId })),
  getStudents: jest.fn((_classId: string) => methodReturns['getStudents'] ?? [dummyStudent({ id: studentId })]),
  remove: jest.fn((_id: string) => methodReturns['remove'] ?? jest.fn()),
  create: jest.fn((_class: ClassCreationType) => methodReturns['create'] ?? dummyClass(_class)),
  update: jest.fn(
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
    it('should return a class', async () => {
      const classService = classServiceMockFactory()

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).get(
        `/classes/${classId}`
      )
      expect(status).toBe(200)
      expect(data).toEqual(dummyClass({ id: classId }).toObject())
    })

    it('should 404 if no class', async () => {
      const classService = classServiceMockFactory()
      classService.findById.mockImplementationOnce(() => {
        throw new NotFoundError(classId, Class)
      })

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).get(
        `/classes/${classId}`
      )
      expect(status).toBe(404)
      expect(data).toMatchInlineSnapshot(`
{
  "code": "NOT_FOUND",
  "message": "Class with locator "95c2faa4-8951-4f7b-bdbf-45aedb060583" could not be found",
  "name": "ClassError",
}
`)
      // .toEqual({
      //   code: 'NOT_FOUND',
      //   message: `Class with locator "${classId}" could not be found`,
      //   name: 'ClassError'
      // })
    })
  })

  it('should 500 if any other error', async () => {
    const classService = classServiceMockFactory()
    classService.findById.mockImplementationOnce(() => {
      throw new Error('boo')
    })

    const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).get(`/classes/${classId}`)
    expect(status).toBe(500)
    expect(data).toMatchInlineSnapshot(`
{
  "code": "UNKNOWN_ERROR",
  "message": "boo",
  "name": "Error",
}
`)
    // message: `Class with locator "${classId}" could not be found`,
    // code: 'NOT_FOUND',
    // name: 'ClassError'
  })

  describe('GET /:id/students', () => {
    it('should return the student list', async () => {
      const classService = classServiceMockFactory()

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).get(
        `/classes/${classId}/students`
      )
      expect(status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.every((student: Student) => !!student.bloodType)).toBe(true)
    })

    it('should return empty list when no students', async () => {
      const classService = classServiceMockFactory()
      classService.getStudents.mockImplementationOnce(() => [])

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).get(
        `/classes/${classId}/students`
      )
      expect(status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(0)
    })

    it('should 404 if no class', async () => {
      const classService = classServiceMockFactory()
      classService.getStudents.mockImplementationOnce(() => {
        throw new NotFoundError(classId, Class)
      })

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).get(
        `/classes/${classId}/students`
      )
      expect(status).toBe(404)
      expect(data).toMatchInlineSnapshot(`
{
  "code": "NOT_FOUND",
  "message": "Class with locator "95c2faa4-8951-4f7b-bdbf-45aedb060583" could not be found",
  "name": "ClassError",
}
`)
      // assert.deepStrictEqual(data, {
      //   code: 'NOT_FOUND',
      //   message: `Class with locator "${classId}" could not be found`,
      //   name: 'ClassError'
      // })
    })

    it('should 500 if any other error', async () => {
      const classService = classServiceMockFactory()
      classService.getStudents.mockImplementationOnce(() => {
        throw new Error('boo')
      })

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).get(
        `/classes/${classId}/students`
      )
      expect(status).toBe(500)
      expect(data).toMatchInlineSnapshot(`
{
  "code": "UNKNOWN_ERROR",
  "message": "boo",
  "name": "Error",
}
`)
    })
  })

  describe('GET /:id/teacher', () => {
    it('should return the teacher', async () => {
      const classService = classServiceMockFactory()

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).get(
        `/classes/${classId}/teacher`
      )
      expect(status).toBe(200)
      expect(Object.keys(data)).toMatchInlineSnapshot(`
[
  "firstName",
  "surname",
  "phone",
  "email",
  "document",
  "salary",
  "hiringDate",
  "major",
  "id",
]
`)
    })

    it('should return 404 when no teacher found', async () => {
      const classService = classServiceMockFactory()
      classService.getTeacher.mockImplementationOnce(() => {
        throw new MissingDependencyError(Teacher, classId, Class)
      })

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).get(
        `/classes/${classId}/teacher`
      )
      expect(status).toBe(404)
      expect(data).toMatchInlineSnapshot(`
{
  "code": "DEPENDENCY_LOCK",
  "message": "Teacher could not be found in Class with locator 95c2faa4-8951-4f7b-bdbf-45aedb060583",
  "name": "TeacherError",
}
`)
    })

    it('should 404 if no class', async () => {
      const classService = classServiceMockFactory()
      classService.getTeacher.mockImplementationOnce(() => {
        throw new NotFoundError(classId, Class)
      })

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).get(
        `/classes/${classId}/teacher`
      )
      expect(status).toBe(404)
      expect(data).toMatchInlineSnapshot(`
{
  "code": "NOT_FOUND",
  "message": "Class with locator "95c2faa4-8951-4f7b-bdbf-45aedb060583" could not be found",
  "name": "ClassError",
}
`)
      // assert.deepStrictEqual(data, {
      //   code: 'NOT_FOUND',
      //   message: `Class with locator "${classId}" could not be found`,
      //   name: 'ClassError'
      // })
    })

    it('should 500 if any other error', async () => {
      const classService = classServiceMockFactory()
      classService.getTeacher.mockImplementationOnce(() => {
        throw new Error('boo')
      })

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).get(
        `/classes/${classId}/teacher`
      )
      expect(status).toBe(500)
      expect(data).toMatchInlineSnapshot(`
{
  "code": "UNKNOWN_ERROR",
  "message": "boo",
  "name": "Error",
}
`)
    })
  })

  describe('GET /', () => {
    it('should list classes', async () => {
      const classService = classServiceMockFactory()

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).get(`/classes`)
      expect(status).toBe(200)
      expect(data).toEqual([dummyClass({ id: classId }).toObject()])
    })

    it('should return empty on no classes', async () => {
      const classService = classServiceMockFactory()
      classService.list.mockImplementationOnce(() => [])

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).get(`/classes`)
      expect(status).toBe(200)
      expect(data).toEqual([])
    })
  })

  describe('POST /', () => {
    it('should return a class', async () => {
      const classService = classServiceMockFactory()

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).post(`/classes`, {
        code: '1B-M',
        teacher: teacherId
      })

      expect(status).toBe(201)
      expect(Object.keys(data).length).toBe(3)
      expect(data.code).toBe('1B-M')
      expect(data.teacher).toBe(teacherId)
      expect(data.id).toMatch(/^[0-9a-f-]{36}$/)
    })

    it('should 500 if any other error', async () => {
      const classService = classServiceMockFactory()
      classService.create.mockImplementationOnce(() => {
        throw new Error('boo')
      })

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).post(`/classes/`, {
        code: '1B-M',
        teacher: null
      })
      expect(status).toBe(500)
      expect(data).toMatchInlineSnapshot(`
{
  "code": "UNKNOWN_ERROR",
  "message": "boo",
  "name": "Error",
}
`)
    })

    it('should 422 on validation error', async () => {
      const classService = classServiceMockFactory()

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).post(`/classes/`, {
        code: '1B-M'
      })
      expect(status).toBe(422)
      expect(data).toMatchInlineSnapshot(`
{
  "issues": [
    {
      "code": "invalid_type",
      "expected": "string",
      "message": "Required",
      "path": [
        "teacher",
      ],
      "received": "undefined",
    },
  ],
  "name": "ZodError",
}
`)
    })

    it('should 409 on conflict error', async () => {
      const classService = classServiceMockFactory()
      classService.create.mockImplementationOnce((creationData: ClassCreationType) => {
        throw new ConflictError(creationData.code, Class)
      })

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).post(`/classes/`, {
        code: '1B-M',
        teacher: null
      })
      expect(status).toBe(409)
      expect(data).toMatchInlineSnapshot(`
{
  "code": "CONFLICT",
  "message": "Class with locator "1B-M" already exists",
  "name": "ClassError",
}
`)
    })

    it('should 404 on teacher not found', async () => {
      const classService = classServiceMockFactory()
      classService.create.mockImplementationOnce((creationData: ClassCreationType) => {
        throw new NotFoundError(creationData.teacher, Teacher)
      })

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).post(`/classes/`, {
        code: '1B-M',
        teacher: teacherId
      })
      expect(status).toBe(404)
      expect(data).toMatchInlineSnapshot(`
{
  "code": "NOT_FOUND",
  "message": "Teacher with locator "998a702b-6123-4ae3-b0d7-9d43227f6032" could not be found",
  "name": "TeacherError",
}
`)
    })
  })

  describe('PUT /:id', () => {
    it('should return a class', async () => {
      const classService = classServiceMockFactory()

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).put(
        `/classes/${classId}`,
        {
          code: '1C-M'
        }
      )

      expect(status).toBe(200)
      expect(Object.keys(data).length).toBe(3)
      expect(data.code).toBe('1C-M')
      expect(data.teacher).toBe(teacherId)
      expect(data.id).toMatch(/^[0-9a-f-]{36}$/)
    })

    it('should 500 if any other error', async () => {
      const classService = classServiceMockFactory()
      classService.update.mockImplementationOnce(() => {
        throw new Error('boo')
      })

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).put(
        `/classes/${classId}`,
        {
          code: '1B-M',
          teacher: null
        }
      )
      expect(status).toBe(500)
      expect(data).toMatchInlineSnapshot(`
{
  "code": "UNKNOWN_ERROR",
  "message": "boo",
  "name": "Error",
}
`)
    })

    it('should 404 on teacher not found', async () => {
      const classService = classServiceMockFactory()
      classService.update.mockImplementationOnce((_id: string, _data: ClassUpdateType) => {
        throw new NotFoundError(_data.teacher, Teacher)
      })

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).put(
        `/classes/${classId}`,
        {
          code: '1B-M',
          teacher: teacherId
        }
      )
      expect(status).toBe(404)
      expect(data).toMatchInlineSnapshot(`
{
  "code": "NOT_FOUND",
  "message": "Teacher with locator "998a702b-6123-4ae3-b0d7-9d43227f6032" could not be found",
  "name": "TeacherError",
}
`)
    })
  })

  describe('DELETE /:id', () => {
    it('should return a class', async () => {
      const classService = classServiceMockFactory()

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).delete(
        `/classes/${classId}`
      )

      expect(status).toBe(204)
      expect(data).toBe('')
    })

    it('should 500 if any other error', async () => {
      const classService = classServiceMockFactory()
      classService.remove.mockImplementationOnce(() => {
        throw new Error('boo')
      })

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).delete(
        `/classes/${classId}`
      )
      expect(status).toBe(500)
      expect(data).toMatchInlineSnapshot(`
{
  "code": "UNKNOWN_ERROR",
  "message": "boo",
  "name": "Error",
}
`)
    })

    it('should 403 if tries to delete with students', async () => {
      const classService = classServiceMockFactory()
      classService.remove.mockImplementationOnce(() => {
        throw new DependencyConflictError(Student, 'something', Class)
      })

      const { data, status } = await axiosist(getApp(classService as unknown as ClassService)).delete(
        `/classes/${classId}`
      )
      expect(status).toBe(403)
      expect(data).toMatchInlineSnapshot(`
{
  "code": "DEPENDENCY_LOCK",
  "message": "Student with locator something cannot be removed because Class has dependencies to it",
  "name": "StudentError",
}
`)
    })
  })
})
