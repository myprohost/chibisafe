import Vue from 'vue';

export const getDefaultState = () => ({
	files: [],
	isLoading: false,
	pagination: {
		page: 1,
		limit: 30,
		totalFiles: 0,
	},
	name: null,
	downloadEnabled: false,
	filesAlbums: {}, // map of file ids with a list of album objects the file is in
});

export const state = getDefaultState;

export const getters = {
	getTotalFiles: ({ pagination }) => pagination.totalFiles,
	getFetchedCount: ({ files }) => files.length,
	shouldPaginate: ({ pagination }) => pagination.totalFiles > pagination.limit,
	getLimit: ({ pagination }) => pagination.limit,
	getName: ({ name }) => name,
};

export const actions = {
	async fetch({ commit, dispatch, state }, page) {
		commit('setIsLoading');

		page = page || 1;

		try {
			const response = await this.$axios.$get('files', { params: { limit: state.pagination.limit, page } });

			commit('setFilesAndMeta', { ...response, page });

			return response;
		} catch (e) {
			dispatch('alert/set', { text: e.message, error: true }, { root: true });
		}

		return null;
	},
	async fetchByAlbumId({ commit, state }, { id, page }) {
		commit('setIsLoading');

		page = page || 1;

		const response = await this.$axios.$get(`album/${id}/full`, {
			params: { limit: state.pagination.limit, page },
		});

		commit('setFilesAndMeta', { ...response, page });

		return response;
	},
	async getFileAlbums({ commit }, fileId) {
		const response = await this.$axios.$get(`file/${fileId}/albums`);

		commit('setFileAlbums', { ...response, fileId });

		return response;
	},
	async addToAlbum({ commit }, { fileId, albumId }) {
		const response = await this.$axios.$post('file/album/add', { fileId, albumId });

		commit('addAlbumToFile', { fileId, albumId, ...response.data });

		return response;
	},
	async removeFromAlbum({ commit }, { fileId, albumId }) {
		const response = await this.$axios.$post('file/album/del', { fileId, albumId });

		commit('removeAlbumFromFile', { fileId, albumId });

		return response;
	},
	async deleteFile({ commit }, fileId) {
		const response = await this.$axios.$delete(`file/${fileId}`);

		commit('removeFile', fileId);

		return response;
	},
};

export const mutations = {
	setIsLoading(state) {
		state.isLoading = true;
	},
	setFilesAndMeta(state, {
		files, name, page, count,
	}) {
		state.files = files || [];
		state.name = name ?? null;
		state.isLoading = false;
		state.pagination.page = page || 1;
		state.pagination.totalFiles = count || 0;
	},
	removeFile(state, fileId) {
		const foundIndex = state.files.findIndex(({ id }) => id === fileId);
		if (foundIndex > -1) {
			state.files.splice(foundIndex, 1);
			state.pagination.totalFiles -= 1;
		}
	},
	setFileAlbums(state, { fileId, albums }) {
		Vue.set(state.filesAlbums, fileId, albums);
	},
	addAlbumToFile(state, { fileId, album }) {
		if (!state.filesAlbums[fileId]) return;

		state.filesAlbums[fileId].push(album);
	},
	removeAlbumFromFile(state, { fileId, albumId }) {
		if (!state.filesAlbums[fileId]) return;

		const foundIndex = state.filesAlbums[fileId].findIndex(({ id }) => id === albumId);
		if (foundIndex > -1) {
			state.filesAlbums[fileId].splice(foundIndex, 1);
		}
	},
	resetState(state) {
		Object.assign(state, getDefaultState());
	},
};
