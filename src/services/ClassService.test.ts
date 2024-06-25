import { describe, it, vi, expect } from 'vitest'
import { randomUUID } from 'node:crypto'
import { ConflictError } from '../domain/Errors/Conflict.js'
import { DependencyConflictError } from '../domain/Errors/DependencyConflict.js'
import { MissingDependencyError } from '../domain/Errors/MissingDependency.js'
import { NotFoundError } from '../domain/Errors/NotFound.js'
import { Teacher } from '../domain/Teacher.js'
import { classId, dummyClass, dummyDatabase, dummyStudent, dummyTeacher, teacherId } from '../utils/fixtures/mocks.js'
import { ClassService } from './ClassService.js'
import type { StudentService } from './StudentService.js'
import type { TeacherService } from './TeacherService.js'
import { Database } from '../data/Db.js'

describe('ClassService', () => {
  // #region Mocks
  const TeacherServiceMock = (mockReturn: { findById?: any } = {}) => ({
    findById: vi.fn((id: string) => mockReturn['findById'] ?? dummyTeacher({ id }))
  })

  const StudentServiceMock = (mockReturn: { listBy?: any } = {}) => ({
    listBy: vi.fn(
      (_prop: string, _value: any) =>
        mockReturn['listBy'] ?? [dummyStudent({ id: '430271c6-735c-46b5-8bb1-1aea803cc5d6', [_prop]: _value })]
    )
  })
  // #endregion

  describe('creation', () => {
    it('should create a class', () => {
      const DBMock = dummyDatabase(dummyClass, {
        listBy: []
      })
      const teacherService = TeacherServiceMock()
      const studentService = StudentServiceMock()
      const service = new ClassService(
        DBMock as unknown as Database,
        teacherService as unknown as TeacherService,
        studentService as unknown as StudentService
      )
      expect(() => service.create(dummyClass().toObject())).not.toThrow()
      expect(DBMock.save.mock.calls.length).toBe(1)
      expect(teacherService.findById.mock.calls.length).toBe(1)
    })

    it('should throw conflict if class already exists', () => {
      const DBMock = dummyDatabase(dummyClass)
      const teacherService = TeacherServiceMock()
      const studentService = StudentServiceMock()
      const service = new ClassService(
        DBMock as unknown as Database,
        teacherService as unknown as TeacherService,
        studentService as unknown as StudentService
      )
      expect(() => service.create(dummyClass().toObject())).toThrow(ConflictError)
      expect(DBMock.save.mock.calls.length).toBe(0)
      expect(teacherService.findById.mock.calls.length).toBe(0)
    })

    it('should throw not found if teacher does not exists', () => {
      const DBMock = dummyDatabase(dummyClass, {
        listBy: []
      })
      const teacherService = TeacherServiceMock()
      teacherService.findById.mockImplementationOnce(() => {
        throw new NotFoundError(teacherId, Teacher)
      })
      const studentService = StudentServiceMock()
      const service = new ClassService(
        DBMock as unknown as Database,
        teacherService as unknown as TeacherService,
        studentService as unknown as StudentService
      )
      expect(() => service.create(dummyClass().toObject())).toThrow(NotFoundError)
      expect(DBMock.save.mock.calls.length).toBe(0)
      expect(teacherService.findById.mock.calls.length).toBe(1)
    })
  })

  describe('update', () => {
    it('should update a class without checking for teacher', () => {
      const DBMock = dummyDatabase(dummyClass)
      const teacherService = TeacherServiceMock()
      const studentService = StudentServiceMock()
      const service = new ClassService(
        DBMock as unknown as Database,
        teacherService as unknown as TeacherService,
        studentService as unknown as StudentService
      )
      const result = service.update(classId, { code: '1C-T' })
      expect(result.code).toBe('1C-T')
      expect(DBMock.save.mock.calls.length).toBe(1)
      expect(DBMock.findById.mock.calls.length).toBe(1)
      expect(teacherService.findById.mock.calls.length).toBe(0)
    })

    it('should update a class checking for teacher', () => {
      const DBMock = dummyDatabase(dummyClass)
      const teacherService = TeacherServiceMock()
      const studentService = StudentServiceMock()
      const service = new ClassService(
        DBMock as unknown as Database,
        teacherService as unknown as TeacherService,
        studentService as unknown as StudentService
      )
      const newTeacherID = randomUUID()
      const result = service.update(classId, { code: '1C-T', teacher: newTeacherID })
      expect(result.code).toBe('1C-T')
      expect(result.teacher).toBe(newTeacherID)
      expect(DBMock.save.mock.calls.length).toBe(1)
      expect(DBMock.findById.mock.calls.length).toBe(1)
      expect(teacherService.findById.mock.calls.length).toBe(1)
    })

    it('should throw not found if teacher does not exists', () => {
      const DBMock = dummyDatabase(dummyClass, {
        listBy: []
      })
      const teacherService = TeacherServiceMock()
      teacherService.findById.mockImplementationOnce(() => {
        throw new NotFoundError(teacherId, Teacher)
      })
      const studentService = StudentServiceMock()
      const service = new ClassService(
        DBMock as unknown as Database,
        teacherService as unknown as TeacherService,
        studentService as unknown as StudentService
      )
      const newTeacherID = randomUUID()
      expect(() => service.update(classId, { code: '1C-T', teacher: newTeacherID })).toThrow(NotFoundError)
      expect(DBMock.save.mock.calls.length).toBe(0)
      expect(DBMock.findById.mock.calls.length).toBe(1)
      expect(teacherService.findById.mock.calls.length).toBe(1)
    })

    it('should throw a not found error if class does not exist', () => {
      const DBMock = dummyDatabase(dummyClass, {
        findById: false as any
      })
      const teacherService = TeacherServiceMock()
      const studentService = StudentServiceMock()
      const service = new ClassService(
        DBMock as unknown as Database,
        teacherService as unknown as TeacherService,
        studentService as unknown as StudentService
      )

      expect(() => service.update(classId, { code: '1C-T' })).toThrow(NotFoundError)
      expect(DBMock.findById.mock.calls.length).toBe(1)
      expect(teacherService.findById.mock.calls.length).toBe(0)
      expect(DBMock.save.mock.calls.length).toBe(0)
    })
  })

  describe('removal', () => {
    it('should remove a class', () => {
      const DBMock = dummyDatabase(dummyClass)
      const teacherService = TeacherServiceMock()
      const studentService = StudentServiceMock({
        listBy: []
      })
      const service = new ClassService(
        DBMock as unknown as Database,
        teacherService as unknown as TeacherService,
        studentService as unknown as StudentService
      )
      expect(() => service.remove(classId)).not.toThrow()
      expect(DBMock.remove.mock.calls.length).toBe(1)
      expect(studentService.listBy.mock.calls.length).toBe(1)
    })

    it('should throw dependency conflict if students are in class', () => {
      const DBMock = dummyDatabase(dummyClass)
      const teacherService = TeacherServiceMock()
      const studentService = StudentServiceMock()
      const service = new ClassService(
        DBMock as unknown as Database,
        teacherService as unknown as TeacherService,
        studentService as unknown as StudentService
      )
      expect(() => service.remove(classId)).toThrow(DependencyConflictError)
      expect(DBMock.remove.mock.calls.length).toBe(0)
    })
  })

  describe('getTeacher', () => {
    it('should get teacher of a class', () => {
      const DBMock = dummyDatabase(dummyClass)
      const teacherService = TeacherServiceMock()
      const studentService = StudentServiceMock()
      const service = new ClassService(
        DBMock as unknown as Database,
        teacherService as unknown as TeacherService,
        studentService as unknown as StudentService
      )
      const result = service.getTeacher(classId)
      expect(result.id).toBe(teacherId)
      expect(DBMock.findById.mock.calls.length).toBe(1)
      expect(teacherService.findById.mock.calls.length).toBe(1)
    })

    it('should throw not found if teacher does not exists', () => {
      const DBMock = dummyDatabase(dummyClass)
      const teacherService = TeacherServiceMock()
      teacherService.findById.mockImplementationOnce(() => {
        throw new NotFoundError(teacherId, Teacher)
      })
      const studentService = StudentServiceMock()
      const service = new ClassService(
        DBMock as unknown as Database,
        teacherService as unknown as TeacherService,
        studentService as unknown as StudentService
      )
      expect(() => service.getTeacher(classId)).toThrow(NotFoundError)
      expect(DBMock.findById.mock.calls.length).toBe(1)
      expect(teacherService.findById.mock.calls.length).toBe(1)
    })

    it('should throw missing dependency if class has no teachers', () => {
      const DBMock = dummyDatabase(dummyClass, {
        findById: dummyClass({ id: classId, teacher: null })
      })
      const teacherService = TeacherServiceMock()
      const studentService = StudentServiceMock()
      const service = new ClassService(
        DBMock as unknown as Database,
        teacherService as unknown as TeacherService,
        studentService as unknown as StudentService
      )
      expect(() => service.getTeacher(classId)).toThrow(MissingDependencyError)
      expect(DBMock.findById.mock.calls.length).toBe(1)
      expect(teacherService.findById.mock.calls.length).toBe(0)
    })
  })

  describe('getStudents', () => {
    it('should get students of a class', () => {
      const DBMock = dummyDatabase(dummyClass)
      const teacherService = TeacherServiceMock()
      const studentService = StudentServiceMock()
      const service = new ClassService(
        DBMock as unknown as Database,
        teacherService as unknown as TeacherService,
        studentService as unknown as StudentService
      )
      const result = service.getStudents(classId)
      expect(result.length).toBe(1)
      expect(DBMock.findById.mock.calls.length).toBe(1)
      expect(studentService.listBy.mock.calls.length).toBe(1)
    })
  })
})
