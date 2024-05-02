import { randomUUID } from 'crypto'
import { ClassCreationType, Class } from '../../domain/Class.js'
import { StudentCreationType, Student } from '../../domain/Student.js'
import { TeacherCreationType, Teacher } from '../../domain/Teacher.js'
import { Database } from '../../data/Db.js'

export const teacherId = '998a702b-6123-4ae3-b0d7-9d43227f6032'
export const classId = '95c2faa4-8951-4f7b-bdbf-45aedb060583'

export const dummyClass = (creationData: Partial<ClassCreationType> & { id: ClassCreationType['id'] }) =>
  new Class({
    id: creationData.id ?? classId,
    code: creationData.code ?? '1B-M',
    teacher: creationData.teacher === undefined ? teacherId : creationData.teacher
  })

export const dummyTeacher = (creationData: Partial<TeacherCreationType> & { id: TeacherCreationType['id'] }) =>
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

export const dummyStudent = (creationData: Partial<StudentCreationType> & { id: StudentCreationType['id'] }) =>
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

export const dummyDatabase = (
  methodReturns: { [T in keyof Omit<Database, 'dbEntity'>]?: ReturnType<Database[T]> },
  t: any
) =>
  ({
    findById: t.mock.fn((id: string) => methodReturns['findById'] ?? dummyClass({ id })),
    list: t.mock.fn(() => methodReturns['list'] ?? [dummyClass({ id: classId })]),
    listBy: t.mock.fn((_prop: string, _value: any) => methodReturns['listBy'] ?? [dummyClass({ id: _value })]),
    remove: t.mock.fn((_id: string) => methodReturns['remove'] ?? t.mock.fn()),
    save: t.mock.fn((_entity: Class) => methodReturns['save'] ?? dummyDatabase(methodReturns, t))
  } as any)
