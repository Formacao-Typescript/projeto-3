import assert from 'node:assert'
import { randomUUID } from 'node:crypto'
import { Mock, describe, it } from 'node:test'
import { ConflictError } from '../domain/Errors/Conflict.js'
import { DependencyConflictError } from '../domain/Errors/DependencyConflict.js'
import { MissingDependencyError } from '../domain/Errors/MissingDependency.js'
import { NotFoundError } from '../domain/Errors/NotFound.js'
import { Teacher } from '../domain/Teacher.js'
import { dummyDatabase, classId, dummyClass, dummyStudent, dummyTeacher, teacherId } from '../utils/fixtures/mocks.js'
import { ClassService } from './ClassService.js'
import { TeacherService } from './TeacherService.js'

describe('ClassService', () => {
  // #region Mocks
  const TeacherServiceMock = (mockReturn: { findById?: any }, t: any) =>
    ({
      findById: t.mock.fn((id: string) => mockReturn['findById'] ?? dummyTeacher({ id }))
    } as { findById: Mock<(id: string) => Teacher> })

  const StudentServiceMock = (mockReturn: { listBy?: any }, t: any) =>
    ({
      listBy: t.mock.fn((_prop: string, _value: any) => mockReturn['listBy'] ?? [dummyStudent({ id: _value })])
    } as any)
  // #endregion

  describe('creation', () => {
    it('should create a class', (t) => {
      const DBMock = dummyDatabase(
        {
          listBy: []
        },
        t
      )
      const teacherService = TeacherServiceMock({}, t)
      const studentService = StudentServiceMock({}, t)
      const service = new ClassService(DBMock, teacherService as unknown as TeacherService, studentService)
      assert.doesNotThrow(() => service.create(dummyClass({ id: classId }).toObject()))
      assert.strictEqual(DBMock.save.mock.callCount(), 1)
      assert.strictEqual(teacherService.findById.mock.callCount(), 1)
    })

    it('should throw conflict if class already exists', (t) => {
      const DBMock = dummyDatabase({}, t)
      const teacherService = TeacherServiceMock({}, t)
      const studentService = StudentServiceMock({}, t)
      const service = new ClassService(DBMock, teacherService as unknown as TeacherService, studentService)
      assert.throws(() => service.create(dummyClass({ id: classId }).toObject()), ConflictError)
      assert.strictEqual(DBMock.save.mock.callCount(), 0)
      assert.strictEqual(teacherService.findById.mock.callCount(), 0)
    })

    it('should throw not found if teacher does not exists', (t) => {
      const DBMock = dummyDatabase(
        {
          listBy: []
        },
        t
      )
      const teacherService = TeacherServiceMock({}, t)
      teacherService.findById.mock.mockImplementationOnce(() => {
        throw new NotFoundError(teacherId, Teacher)
      })
      const studentService = StudentServiceMock({}, t)
      const service = new ClassService(DBMock, teacherService as unknown as TeacherService, studentService)
      assert.throws(() => service.create(dummyClass({ id: classId }).toObject()), NotFoundError)
      assert.strictEqual(DBMock.save.mock.callCount(), 0)
      assert.strictEqual(teacherService.findById.mock.callCount(), 1)
    })
  })

  describe('update', () => {
    it('should update a class without checking for teacher', (t) => {
      const DBMock = dummyDatabase({}, t)
      const teacherService = TeacherServiceMock({}, t)
      const studentService = StudentServiceMock({}, t)
      const service = new ClassService(DBMock, teacherService as unknown as TeacherService, studentService)
      const result = service.update(classId, { code: '1C-T' })
      assert.deepStrictEqual(result.code, '1C-T')
      assert.strictEqual(DBMock.save.mock.callCount(), 1)
      assert.strictEqual(DBMock.findById.mock.callCount(), 1)
      assert.strictEqual(teacherService.findById.mock.callCount(), 0)
    })

    it('should update a class checking for teacher', (t) => {
      const DBMock = dummyDatabase({}, t)
      const teacherService = TeacherServiceMock({}, t)
      const studentService = StudentServiceMock({}, t)
      const service = new ClassService(DBMock, teacherService as unknown as TeacherService, studentService)
      const newTeacherID = randomUUID()
      const result = service.update(classId, { code: '1C-T', teacher: newTeacherID })
      assert.deepStrictEqual(result.code, '1C-T')
      assert.deepStrictEqual(result.teacher, newTeacherID)
      assert.strictEqual(DBMock.save.mock.callCount(), 1)
      assert.strictEqual(DBMock.findById.mock.callCount(), 1)
      assert.strictEqual(teacherService.findById.mock.callCount(), 1)
    })

    it('should throw not found if teacher does not exists', (t) => {
      const DBMock = dummyDatabase(
        {
          listBy: []
        },
        t
      )
      const teacherService = TeacherServiceMock({}, t)
      teacherService.findById.mock.mockImplementationOnce(() => {
        throw new NotFoundError(teacherId, Teacher)
      })
      const studentService = StudentServiceMock({}, t)
      const service = new ClassService(DBMock, teacherService as unknown as TeacherService, studentService)
      const newTeacherID = randomUUID()
      assert.throws(() => service.update(classId, { code: '1C-T', teacher: newTeacherID }), NotFoundError)
      assert.strictEqual(DBMock.save.mock.callCount(), 0)
      assert.strictEqual(DBMock.findById.mock.callCount(), 1)
      assert.strictEqual(teacherService.findById.mock.callCount(), 1)
    })
  })

  describe('removal', () => {
    it('should remove a class', (t) => {
      const DBMock = dummyDatabase({}, t)
      const teacherService = TeacherServiceMock({}, t)
      const studentService = StudentServiceMock(
        {
          listBy: []
        },
        t
      )
      const service = new ClassService(DBMock, teacherService as unknown as TeacherService, studentService)
      assert.doesNotThrow(() => service.remove(classId))
      assert.strictEqual(DBMock.remove.mock.callCount(), 1)
      assert.strictEqual(studentService.listBy.mock.callCount(), 1)
    })

    it('should throw dependency conflict if students are in class', (t) => {
      const DBMock = dummyDatabase({}, t)
      const teacherService = TeacherServiceMock({}, t)
      const studentService = StudentServiceMock({}, t)
      const service = new ClassService(DBMock, teacherService as unknown as TeacherService, studentService)
      assert.throws(() => service.remove(classId), DependencyConflictError)
      assert.strictEqual(DBMock.remove.mock.callCount(), 0)
    })
  })

  describe('getTeacher', () => {
    it('should get teacher of a class', (t) => {
      const DBMock = dummyDatabase({}, t)
      const teacherService = TeacherServiceMock({}, t)
      const studentService = StudentServiceMock({}, t)
      const service = new ClassService(DBMock, teacherService as unknown as TeacherService, studentService)
      const result = service.getTeacher(classId)
      assert.deepStrictEqual(result.id, teacherId)
      assert.strictEqual(DBMock.findById.mock.callCount(), 1)
      assert.strictEqual(teacherService.findById.mock.callCount(), 1)
    })

    it('should throw not found if teacher does not exists', (t) => {
      const DBMock = dummyDatabase({}, t)
      const teacherService = TeacherServiceMock({}, t)
      teacherService.findById.mock.mockImplementationOnce(() => {
        throw new NotFoundError(teacherId, Teacher)
      })
      const studentService = StudentServiceMock({}, t)
      const service = new ClassService(DBMock, teacherService as unknown as TeacherService, studentService)
      assert.throws(() => service.getTeacher(classId), NotFoundError)
      assert.strictEqual(DBMock.findById.mock.callCount(), 1)
      assert.strictEqual(teacherService.findById.mock.callCount(), 1)
    })

    it('should throw missing dependency if class has no teachers', (t) => {
      const DBMock = dummyDatabase(
        {
          findById: dummyClass({ id: classId, teacher: null })
        },
        t
      )
      const teacherService = TeacherServiceMock({}, t)
      const studentService = StudentServiceMock({}, t)
      const service = new ClassService(DBMock, teacherService as unknown as TeacherService, studentService)
      assert.throws(() => service.getTeacher(classId), MissingDependencyError)
      assert.strictEqual(DBMock.findById.mock.callCount(), 1)
      assert.strictEqual(teacherService.findById.mock.callCount(), 0)
    })
  })

  describe('getStudents', () => {
    it('should get students of a class', (t) => {
      const DBMock = dummyDatabase({}, t)
      const teacherService = TeacherServiceMock({}, t)
      const studentService = StudentServiceMock({}, t)
      const service = new ClassService(DBMock, teacherService as unknown as TeacherService, studentService)
      const result = service.getStudents(classId)
      assert.strictEqual(result.length, 1)
      assert.strictEqual(DBMock.findById.mock.callCount(), 1)
      assert.strictEqual(studentService.listBy.mock.callCount(), 1)
    })
  })
})
