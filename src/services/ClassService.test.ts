import assert from 'node:assert'
import { randomUUID } from 'node:crypto'
import { Mock, TestContext, describe, it, mock } from 'node:test'
import { Database } from '../data/Db.js'
import { Class, ClassCreationType } from '../domain/Class.js'
import { ConflictError } from '../domain/Errors/Conflict.js'
import { Student, StudentCreationType } from '../domain/Student.js'
import { Teacher, TeacherCreationType } from '../domain/Teacher.js'
import { ClassService } from './ClassService.js'
import { TeacherService } from './TeacherService.js'

describe('ClassService', () => {
  const teacherId = randomUUID()
  const classId = randomUUID()

  const mockClass = (creationData: Partial<ClassCreationType> & { id: ClassCreationType['id'] }) =>
    new Class({ code: creationData.code ?? '1B-M', teacher: creationData.teacher ?? teacherId })

  const mockTeacher = (creationData: Partial<TeacherCreationType> & { id: TeacherCreationType['id'] }) =>
    new Teacher({
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
      birthDate: creationData.birthDate ?? new Date('2010-10-10').toISOString(),
      class: creationData.class ?? '1B-M',
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
      findById: mock.fn((id: string) => mockReturn['findById'] ?? mockTeacher({ id }))
    } as { findById: Mock<(id: string) => Teacher> })

  const StudentServiceMock = (mockReturn: { listBy?: any }, t: any) =>
    ({
      listBy: t.mock.fn((_prop: string, _value: any) => mockReturn['listBy'] ?? [mockStudent({ id: _value })])
    } as any)

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
    assert.ok(DBMock.save.mock.callCount() === 1)
    assert.ok(teacherService.findById.mock.callCount() === 1)
  })

  it('should throw conflict if class already exists', (t) => {
    const DBMock = DBMockFactory({}, t)
    const teacherService = TeacherServiceMock({}, t)
    const studentService = StudentServiceMock({}, t)
    const service = new ClassService(DBMock, teacherService as unknown as TeacherService, studentService)
    assert.throws(() => service.create(mockClass({ id: classId }).toObject()), ConflictError)
    assert.ok(DBMock.save.mock.callCount() === 0)
    assert.ok(teacherService.findById.mock.callCount() === 0)
  })

  it('should throw not found if teacher does not exists', (t) => {
    const DBMock = DBMockFactory({}, t)
    const teacherService = TeacherServiceMock({ findById: undefined }, t)
    const studentService = StudentServiceMock({}, t)
    const service = new ClassService(DBMock, teacherService as unknown as TeacherService, studentService)
    assert.throws(() => service.create(mockClass({ id: classId }).toObject()), ConflictError)
    assert.ok(DBMock.save.mock.callCount() === 0)
    assert.ok(teacherService.findById.mock.callCount() === 0)
  })
})
