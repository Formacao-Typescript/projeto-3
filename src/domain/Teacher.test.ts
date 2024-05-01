import { describe, it } from 'node:test'
import assert from 'node:assert'
import { Teacher } from './Teacher.js'
import { ZodError } from 'zod'

describe('Teacher', () => {
  const teacherObj = {
    firstName: 'Lucas',
    surname: 'Santos',
    phone: '123456789',
    email: 'foo@gmail.com',
    document: '123456789',
    hiringDate: new Date('2020-10-20').toISOString(),
    major: 'Computer Science',
    salary: 5000
  }

  it('should return an instance of the entity with the correct data', () => {
    const teacher = new Teacher(teacherObj)
    assert.ok(teacher instanceof Teacher)
  })
  it('should return the correct data on toObject', () => {
    const teacher = new Teacher(teacherObj)
    assert.deepStrictEqual(teacher.toObject(), { ...teacherObj, id: teacher.id })
  })

  it('should return the correct data on toJSON', () => {
    const teacher = new Teacher(teacherObj)
    assert.strictEqual(teacher.toJSON(), JSON.stringify(teacher.toObject()))
  })

  it('should return an instance of the entity with the correct data from fromObject', () => {
    const teacher = Teacher.fromObject(teacherObj)
    assert.ok(teacher instanceof Teacher)
    assert.deepStrictEqual(teacher.toObject(), { ...teacherObj, id: teacher.id })
  })

  it('should return an error upon invalid data', () => {
    assert.throws(() => {
      new Teacher({ ...teacherObj, hiringDate: 'invalid' })
    }, ZodError)
  })
})
