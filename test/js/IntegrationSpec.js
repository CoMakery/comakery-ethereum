import './testHelper'
import {keys} from 'lodash'
import chai, {expect} from 'chai'
const chaiHttp = require('chai-http')

const server = require('../../lib/server')

chai.use(chaiHttp)

describe('POST /project', () => {
  it('should return a contract address', (done) => {
    chai
    .request(server)
    .post('/project')
    .send({ maxSupply: 101 })
    .then(function (res) {
      expect(res).to.have.status(200)
      const {body} = res
      expect(keys(body)).to.deep.equal(['contractAddress'])
      expect(body.contractAddress).to.match(/^0x[0-9a-f]{40}$/)
    }).then(done).catch(done)
  })
})

/* Declare global variables for eslint to ignore: */
/* global describe */
/* global it */
