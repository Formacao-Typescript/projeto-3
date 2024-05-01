import assert from 'node:assert'
import { randomUUID } from 'node:crypto'
import { describe, it } from 'node:test'
import { Student, StudentCreationType } from './Student.js'
import { ZodError } from 'zod'

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
    assert.ok(student instanceof Student)
  })
  it('should return the correct data on toObject', () => {
    const student = new Student(studentObj)
    assert.deepStrictEqual(student.toObject(), {
      ...studentObj,
      id: student.id,
      medications: undefined,
      allergies: undefined
    })
  })

  it('should return the correct data on toJSON', () => {
    const student = new Student(studentObj)
    assert.strictEqual(student.toJSON(), JSON.stringify(student.toObject()))
  })

  it('should return an instance of the entity with the correct data from fromObject', () => {
    const student = Student.fromObject(studentObj)
    assert.ok(student instanceof Student)
    assert.deepStrictEqual(student.toObject(), {
      ...studentObj,
      id: student.id,
      medications: undefined,
      allergies: undefined
    })
  })

  it('should return an error upon invalid data', () => {
    assert.throws(() => {
      new Student({ ...studentObj, birthDate: 'invalid' })
    }, ZodError)
  })
})
