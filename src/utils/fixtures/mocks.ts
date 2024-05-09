import { randomUUID } from 'crypto'
import { ClassCreationType, Class } from '../../domain/Class.js'
import { StudentCreationType, Student } from '../../domain/Student.js'
import { TeacherCreationType, Teacher } from '../../domain/Teacher.js'
import { Database } from '../../data/Db.js'
import { Serializable } from '../../domain/types.js'
import type { TestContext } from 'node:test'

export const teacherId = '998a702b-6123-4ae3-b0d7-9d43227f6032'
export const classId = '95c2faa4-8951-4f7b-bdbf-45aedb060583'

export const dummyClass = (creationData?: Partial<ClassCreationType>) =>
  new Class({
    id: creationData?.id || classId,
    code: creationData?.code ?? '1B-M',
    teacher: creationData?.teacher === undefined ? teacherId : creationData.teacher
  })

export const dummyTeacher = (creationData?: Partial<TeacherCreationType>) =>
  new Teacher({
    id: creationData?.id ?? teacherId,
    firstName: creationData?.firstName ?? 'John',
    surname: creationData?.surname ?? 'Doe',
    document: creationData?.document ?? '12345678900',
    email: creationData?.email ?? 'foo@gmail.com',
    hiringDate: creationData?.hiringDate ?? new Date('2010-10-10').toISOString(),
    major: creationData?.major ?? 'Math',
    phone: creationData?.phone ?? '12345678900',
    salary: creationData?.salary ?? 1000
  })

export const dummyStudent = (creationData?: Partial<StudentCreationType>) =>
  new Student({
    id: creationData?.id ?? randomUUID(),
    birthDate: creationData?.birthDate ?? new Date('2010-10-10').toISOString(),
    class: creationData?.class ?? classId,
    document: creationData?.document ?? '12345678900',
    bloodType: creationData?.bloodType ?? 'A+',
    firstName: creationData?.firstName ?? 'John',
    surname: creationData?.surname ?? 'Doe',
    startDate: creationData?.startDate ?? new Date('2010-10-10').toISOString(),
    parents: creationData?.parents ?? [randomUUID(), randomUUID()]
  })

export const dummyDatabase = <ReturnEntity extends (...args: any) => Serializable>(
  t: TestContext,
  entityFactory: ReturnEntity,
  methodReturns: { [DBKey in keyof Omit<Database, 'dbEntity'>]?: ReturnType<Database[DBKey]> } = {}
) =>
  ({
    findById: t.mock.fn((id: string) => methodReturns['findById'] ?? entityFactory({ id })),
    list: t.mock.fn(() => methodReturns['list'] ?? [entityFactory()]),
    listBy: t.mock.fn(
      (_prop: string, _value: any) => methodReturns['listBy'] ?? [entityFactory({ id: classId, [_prop]: _value })]
    ),
    remove: t.mock.fn((_id: string) => methodReturns['remove'] ?? t.mock.fn()),
    save: t.mock.fn((_entity: ReturnType<ReturnEntity>) => methodReturns['save'] ?? dummyDatabase(t, entityFactory, methodReturns)),
    dbEntity: 'dummyEntity'
  } as any)

