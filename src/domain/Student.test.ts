import { describe, it, expect } from 'vitest'
import { randomUUID } from 'node:crypto'
import { ZodError } from 'zod'
import { Student, StudentCreationType } from './Student.js'

describe('Student', () => {
  const studentObj: StudentCreationType = {
    firstName: 'Lucas',
    surname: 'Santos',
    birthDate: new Date('1995-01-01').toISOString(),
    bloodType: 'A+',
    class: randomUUID(),
    document: '123456789',
    parents: [randomUUID()],
    startDate: new Date('2010-10-10').toISOString()
  }

  it('should return an instance of the entity with the correct data', () => {
    const student = new Student(studentObj)
    expect(student).toBeInstanceOf(Student)
  })
  it('should return the correct data on toObject', () => {
    const student = new Student(studentObj)
    expect(student.toObject()).toStrictEqual({
      ...studentObj,
      id: student.id,
      medications: undefined,
      allergies: undefined
    })
  })

  it('should return the correct data on toJSON', () => {
    const student = new Student(studentObj)
    expect(student.toJSON()).toStrictEqual(JSON.stringify(student.toObject()))
  })

  it('should return an instance of the entity with the correct data from fromObject', () => {
    const student = Student.fromObject(studentObj)
    expect(student).toBeInstanceOf(Student)
    expect(student.toObject()).toStrictEqual({
      ...studentObj,
      id: student.id,
      medications: undefined,
      allergies: undefined
    })
  })

  it('should return an error upon invalid data', () => {
    expect(() => {
      new Student({ ...studentObj, birthDate: 'invalid' })
    }).toThrow(ZodError)
  })
})
