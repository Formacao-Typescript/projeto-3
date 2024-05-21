import { describe, expect, it } from '@jest/globals'
import { ZodError } from 'zod'
import { Teacher } from './Teacher.js'

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
    expect(teacher).toBeInstanceOf(Teacher)
  })
  it('should return the correct data on toObject', () => {
    const teacher = new Teacher(teacherObj)
    expect(teacher.toObject()).toStrictEqual({
      ...teacherObj,
      id: teacher.id
    })
  })

  it('should return the correct data on toJSON', () => {
    const teacher = new Teacher(teacherObj)
    expect(teacher.toJSON()).toStrictEqual(JSON.stringify(teacher.toObject()))
  })

  it('should return an instance of the entity with the correct data from fromObject', () => {
    const teacher = Teacher.fromObject(teacherObj)
    expect(teacher).toBeInstanceOf(Teacher)
    expect(teacher.toObject()).toStrictEqual({
      ...teacherObj,
      id: teacher.id
    })
  })

  it('should return an error upon invalid data', () => {
    expect(() => {
      new Teacher({ ...teacherObj, hiringDate: 'invalid' })
    }).toThrow(ZodError)
  })
})
