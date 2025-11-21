/**
 * Gets the repositories of the user from Github
 */

import { call, put, select, takeLatest } from 'redux-saga/effects';
import { FETCH_COLLECTION } from '../App/constants';
import { gotCollection, failedToGetCollection } from '../App/actions';

import request from '../../utils/request';
import { makeSelectCollectionName, makeSelectToken } from '../App/selectors';
import { API_URL } from '../../utils/apiConfig';

/**
 * Github repos request/response handler
 */
export function* getCollection() {
  const collectionName = yield select(makeSelectCollectionName());
  const token = yield select(makeSelectToken());
  // Use the configured API URL instead of window.location
  const requestURL = `${API_URL}/${collectionName}`;
  try {
    const collection = yield call(request, requestURL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${token}`,
      },
    });
    yield put(gotCollection(collection));
  } catch (err) {
    yield put(failedToGetCollection(err.message));
  }
}

/**
 * Root saga manages watcher lifecycle
 */
export default function* airregistryData() {
  // Watches for FETCH_COLLECTION actions and calls getCollection when one comes in.
  // By using `takeLatest` only the result of the latest API call is applied.
  // It returns task descriptor (just like fork) so we can continue execution
  // It will be cancelled automatically on component unmount
  yield takeLatest(FETCH_COLLECTION, getCollection);
}
