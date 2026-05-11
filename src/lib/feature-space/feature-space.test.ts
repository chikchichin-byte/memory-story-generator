import { describe, it, expect } from 'vitest'
import { createFeatureSpaceStore } from './feature-space'

describe('FeatureSpace Store', () => {
  it('initial state is empty', () => {
    const store = createFeatureSpaceStore()
    const state = store.getState()

    expect(state.photos).toEqual([])
    expect(state.features).toEqual([])
  })

  it('addPhotos adds photos to state', () => {
    const store = createFeatureSpaceStore()
    const photos = [
      {
        id: '1',
        file: new File([''], 'test.jpg', { type: 'image/jpeg' }),
        url: 'blob:1',
        uploadedAt: new Date('2024-01-01'),
      },
    ]

    store.dispatch({ type: 'addPhotos', photos })
    const state = store.getState()

    expect(state.photos).toEqual(photos)
  })

  it('setFeatures sets features in state', () => {
    const store = createFeatureSpaceStore()
    const features = [
      {
        photoId: '1',
        timestamp: new Date('2024-01-01'),
        location: 'Paris',
      },
    ]

    store.dispatch({ type: 'setFeatures', features })
    const state = store.getState()

    expect(state.features).toEqual(features)
  })

  it('updateFeature updates existing feature', () => {
    const store = createFeatureSpaceStore()
    const features = [
      {
        photoId: '1',
        timestamp: new Date('2024-01-01'),
        location: 'Paris',
      },
    ]
    store.dispatch({ type: 'setFeatures', features })

    store.dispatch({
      type: 'updateFeature',
      photoId: '1',
      feature: { location: 'London' },
    })

    const state = store.getState()
    expect(state.features[0].location).toBe('London')
    expect(state.features[0].timestamp).toEqual(new Date('2024-01-01'))
  })

  it('subscribe notifies listeners of state changes', () => {
    const store = createFeatureSpaceStore()
    let callCount = 0

    const unsubscribe = store.subscribe(() => {
      callCount++
    })

    store.dispatch({
      type: 'addPhotos',
      photos: [
        {
          id: '1',
          file: new File([''], 'test.jpg', { type: 'image/jpeg' }),
          url: 'blob:1',
          uploadedAt: new Date(),
        },
      ],
    })

    expect(callCount).toBe(1)

    unsubscribe()

    store.dispatch({
      type: 'addPhotos',
      photos: [
        {
          id: '2',
          file: new File([''], 'test2.jpg', { type: 'image/jpeg' }),
          url: 'blob:2',
          uploadedAt: new Date(),
        },
      ],
    })

    expect(callCount).toBe(1) // Should not increment after unsubscribe
  })

  it('state updates are immutable', () => {
    const store = createFeatureSpaceStore()
    const photos = [
      {
        id: '1',
        file: new File([''], 'test.jpg', { type: 'image/jpeg' }),
        url: 'blob:1',
        uploadedAt: new Date(),
      },
    ]

    const state1 = store.getState()
    store.dispatch({ type: 'addPhotos', photos })
    const state2 = store.getState()

    expect(state1).not.toBe(state2) // Different reference
    expect(state1.photos).not.toBe(state2.photos) // Different array reference
  })
})
