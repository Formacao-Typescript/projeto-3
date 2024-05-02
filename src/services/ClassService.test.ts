import assert from 'node:assert'
import { randomUUID } from 'node:crypto'
import { Mock, describe, it } from 'node:test'
import { Database } from '../data/Db.js'
import { Class, ClassCreationType } from '../domain/Class.js'
import { ConflictError } from '../domain/Errors/Conflict.js'
import { DependencyConflictError } from '../domain/Errors/DependencyConflict.js'
import { NotFoundError } from '../domain/Errors/NotFound.js'
import { Student, StudentCreationType } from '../domain/Student.js'
import { Teacher, TeacherCreationType } from '../domain/Teacher.js'
import { ClassService } from './ClassService.js'
import { TeacherService } from './TeacherService.js'
import { MissingDependencyError } from '../domain/Errors/MissingDependency.js'

describe('ClassService', () => {
  // #region Mocks
  const teacherId = '998a702b-6123-4ae3-b0d7-9d43227f6032'
  const classId = '95c2faa4-8951-4f7b-bdbf-45aedb060583'

  const mockClass = (creationData: Partial<ClassCreationType> & { id: ClassCreationType['id'] }) =>
    new Class({
      code: creationData.code ?? '1B-M',
      teacher: creationData.teacher === undefined ? teacherId : creationData.teacher
    })

  const mockTeacher = (creationData: Partial<TeacherCreationType> & { id: TeacherCreationType['id'] }) =>
    new Teacher({
      id: creationData.id ?? teacherId,
      firstName: creationData.firstName ?? 'John',
      surname: creationData.surname ?? 'Doe',
      document: creationData.document ?? '12345678900',
      email: creationData.email ?? 'foo@gmail.com',
      hiringDate: creationData.hiringDate ?? new Date('2010-10-10').toISOString(),
      major: creationData.major ?? 'Math',
      phone: creationData.phone ?? '12345678900',
      salary: creationData.salary ?? 1000
    })

  const mockStudent = (creationData: Partial<StudentCreationType> & { id: StudentCreationType['id'] }) =>
    new Student({
      id: creationData.id ?? randomUUID(),
      birthDate: creationData.birthDate ?? new Date('2010-10-10').toISOString(),
      class: creationData.class ?? classId,
      document: creationData.document ?? '12345678900',
      bloodType: creationData.bloodType ?? 'A+',
      firstName: creationData.firstName ?? 'John',
      surname: creationData.surname ?? 'Doe',
      startDate: creationData.startDate ?? new Date('2010-10-10').toISOString(),
      parents: creationData.parents ?? [randomUUID(), randomUUID()]
    })

  const DBMockFactory = (
    methodReturns: { [T in keyof Omit<Database, 'dbEntity'>]?: ReturnType<Database[T]> },
    t: any
  ) =>
    ({
      findById: t.mock.fn((id: string) => methodReturns['findById'] ?? mockClass({ id })),
      list: t.mock.fn(() => methodReturns['list'] ?? [mockClass({ id: classId })]),
      listBy: t.mock.fn((_prop: string, _value: any) => methodReturns['listBy'] ?? [mockClass({ id: _value })]),
      remove: t.mock.fn((_id: string) => methodReturns['remove'] ?? t.mock.fn()),
      save: t.mock.fn((_entity: Class) => methodReturns['save'] ?? DBMockFactory(methodReturns, t))
    } as any)

  const TeacherServiceMock = (mockReturn: { findById?: any }, t: any) =>
    ({
      findById: t.mock.fn((id: string) => mockReturn['findById'] ?? mockTeacher({ id }))
    } as { findById: Mock<(id: string) => Teacher> })

  const StudentServiceMock = (mockReturn: { listBy?: any }, t: any) =>
    ({
      listBy: t.mock.fn((_prop: string, _value: any) => mockReturn['listBy'] ?? [mockStudent({ id: _value })])
    } as any)
  // #endregion

  describe('creation', () => {
    it('should create a class', (t) => {
      const DBMock = DBMockFactory(
        {
          listBy: []
        },
        t
      )
      const teacherService = TeacherServiceMock({}, t)
      const studentService = StudentServiceMock({}, t)
      const service = new ClassService(DBMock, teacherService as unknown as TeacherService, studentService)
      assert.doesNotThrow(() => service.create(mockClass({ id: classId }).toObject()))
      assert.strictEqual(DBMock.save.mock.callCount(), 1)
      assert.strictEqual(teacherService.findById.mock.callCount(), 1)
    })

    it('should throw conflict if class already exists', (t) => {
      const DBMock = DBMockFactory({}, t)
      const teacherService = TeacherServiceMock({}, t)
      const studentService = StudentServiceMock({}, t)
      const service = new ClassService(DBMock, teacherService as unknown as TeacherService, studentService)
      assert.throws(() => service.create(mockClass({ id: classId }).toObject()), ConflictError)
      assert.strictEqual(DBMock.save.mock.callCount(), 0)
      assert.strictEqual(teacherService.findById.mock.callCount(), 0)
    })

    it('should throw not found if teacher does not exists', (t) => {
      const DBMock = DBMockFactory(
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
      assert.throws(() => service.create(mockClass({ id: classId }).toObject()), NotFoundError)
      assert.strictEqual(DBMock.save.mock.callCount(), 0)
      assert.strictEqual(teacherService.findById.mock.callCount(), 1)
    })
  })

  describe('update', () => {
    it('should update a class without checking for teacher', (t) => {
      const DBMock = DBMockFactory({}, t)
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
      const DBMock = DBMockFactory({}, t)
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
      const DBMock = DBMockFactory(
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
      const DBMock = DBMockFactory({}, t)
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
      const DBMock = DBMockFactory({}, t)
      const teacherService = TeacherServiceMock({}, t)
      const studentService = StudentServiceMock({}, t)
      const service = new ClassService(DBMock, teacherService as unknown as TeacherService, studentService)
      assert.throws(() => service.remove(classId), DependencyConflictError)
      assert.strictEqual(DBMock.remove.mock.callCount(), 0)
    })
  })

  describe('getTeacher', () => {
    it('should get teacher of a class', (t) => {
      const DBMock = DBMockFactory({}, t)
      const teacherService = TeacherServiceMock({}, t)
      const studentService = StudentServiceMock({}, t)
      const service = new ClassService(DBMock, teacherService as unknown as TeacherService, studentService)
      const result = service.getTeacher(classId)
      assert.deepStrictEqual(result.id, teacherId)
      assert.strictEqual(DBMock.findById.mock.callCount(), 1)
      assert.strictEqual(teacherService.findById.mock.callCount(), 1)
    })

    it('should throw not found if teacher does not exists', (t) => {
      const DBMock = DBMockFactory({}, t)
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
      const DBMock = DBMockFactory(
        {
          findById: mockClass({ id: classId, teacher: null })
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
      const DBMock = DBMockFactory({}, t)
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
