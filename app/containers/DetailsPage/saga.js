/**
 * Gets the repositories of the user from Github
 */

import { call, put, select, takeLatest } from 'redux-saga/effects';
import { FETCH_DETAILS } from './constants';
import { failedFetchingDetailsAction, gotDetailsAction } from './actions';

import request from '../../utils/request';
import { makeSelectToken } from '../App/selectors';

/**
 * Github repos request/response handler
 */
export function* getDetails(action) {
  const { id, detailsType, privilaged } = action;
  const token = yield select(makeSelectToken());
  const requestURL = `${window.location.protocol}//${window.location.hostname}${
    window.location.port ? `:${window.location.port}` : ''
  }/api/v1/${detailsType}/${id}${privilaged ? '/privileged' : ''}`;
  try {
    const collection = yield call(request, requestURL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${token}`,
      },
    });
    yield put(gotDetailsAction(collection));
  } catch (err) {
    yield put(failedFetchingDetailsAction(err.message));
  }
}

/**
 * Root saga manages watcher lifecycle
 */
export default function* airregistryData() {
  // Watches for FETCH_DETAILS actions and calls getDetails when one comes in.
  // By using `takeLatest` only the result of the latest API call is applied.
  // It returns task descriptor (just like fork) so we can continue execution
  // It will be cancelled automatically on component unmount
  yield takeLatest(FETCH_DETAILS, getDetails);
}
